// src/ViewModels/NutritionistApplicationViewModel.js
import { makeAutoObservable } from 'mobx';
import NutritionistApplicationRepository from '../Repositories/NutritionistApplicationRepository';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import nutritionistApplicationRepository from '../Repositories/NutritionistApplicationRepository';
import AdminDashboardViewModel from './AdminDashboardViewModel';

class NutritionistApplicationViewModel {
    application = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dob: '',
    };

    document = null;
    agreedToTerms = false;
    error = '';
    showInfoModal = false;
    showPendingApprovalModal = false;
    showEmailVerificationModal = false;
    isLoading = false;
    isEmailVerified = false;
    tempUser = null;
    verifiedUserId = null;

    constructor() {
        makeAutoObservable(this);
    }

    setFirstName(value) {
        this.application.firstName = value;
    }

    setLastName(value) {
        this.application.lastName = value;
    }

    setEmail(value) {
        this.application.email = value;
    }

    setPassword(value) {
        this.application.password = value;
    }

    setConfirmPassword(value) {
        this.application.confirmPassword = value;
    }

    setDob(value) {
        this.application.dob = value;
    }

    setField(field, value) {
        this.application[field] = value;
    }

    setDocument(file) {
        if (file && file.type === 'application/pdf') {
            this.document = file;
            this.error = '';
        } else {
            this.document = null;
            this.error = 'Please upload a valid PDF file.';
        }
    }

    setAgreedToTerms(value) {
        this.agreedToTerms = value;
    }

    setShowInfoModal(val) {
        this.showInfoModal = val;
    }

    setShowPendingApprovalModal(val) {
        this.showPendingApprovalModal = val;
    }

    setShowEmailVerificationModal(val) {
        this.showEmailVerificationModal = val;
    }

    setLoading(val) {
        this.isLoading = val;
    }

    setError(msg) {
        this.error = msg;
    }

    setIsEmailVerified(val) {
        this.isEmailVerified = val;
    }

    setTempUser(user) {
        this.tempUser = user;
    }

    setVerifiedUserId(userId) {
        this.verifiedUserId = userId;
    }

    validate() {
        const a = this.application;
        if (!a.firstName || !a.lastName || !a.email || !a.dob || !a.password || !a.confirmPassword) {
            this.setError('All fields are required.');
            return false;
        }
        if (a.password.length < 6) {
            this.setError('Password must be at least 6 characters.');
            return false;
        }
        if (a.password !== a.confirmPassword) {
            this.setError('Passwords do not match.');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) {
            this.setError('Please enter a valid email.');
            return false;
        }
        if (!this.document) {
            this.setError('Please upload your certificate.');
            return false;
        }
        if (!this.agreedToTerms) {
            this.setError('You must agree to the terms and conditions.');
            return false;
        }

        this.setError('');
        return true;
    }

    async sendEmailVerification() {
        if (!this.validate()) return;

        this.setLoading(true);
        this.setError('');

        try {
            const auth = getAuth();
            
            // Create temporary user for email verification
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                this.application.email, 
                this.application.password
            );
            
            this.setTempUser(userCredential.user);
            this.setVerifiedUserId(userCredential.user.uid);
            
            // Send verification email
            await sendEmailVerification(userCredential.user);
            
            // Sign out the temp user immediately
            await signOut(auth);
            
            this.setShowEmailVerificationModal(true);
            
        } catch (error) {
            console.error("Email verification error:", error);
            if (error.code === 'auth/email-already-in-use') {
                this.setError('This email is already registered. Please use a different email.');
            } else {
                this.setError(error.message || 'Failed to send verification email.');
            }
        } finally {
            this.setLoading(false);
        }
    }

    async checkEmailVerification() {
        if (!this.tempUser || !this.verifiedUserId) {
            this.setError('No verification in progress.');
            return;
        }

        this.setLoading(true);
        this.setError('');

        try {
            const auth = getAuth();
            
            // Sign in to check verification status
            const userCredential = await signInWithEmailAndPassword(
                auth,
                this.application.email,
                this.application.password
            );

            // Reload user to get latest verification status
            await userCredential.user.reload();
            
            if (userCredential.user.emailVerified) {
                this.setIsEmailVerified(true);
                this.setShowEmailVerificationModal(false);
                this.setError('');
                
                // Pass the authenticated user directly to submitApplication
                await this.submitApplicationWithUser(userCredential.user);
                
            } else {
                this.setError('Email not verified yet. Please check your email and click the verification link.');
                await signOut(auth);
            }
        } catch (error) {
            console.error("Email verification check error:", error);
            this.setError('Failed to check email verification status.');
            // Make sure to sign out on error
            try {
                await signOut(getAuth());
            } catch (signOutError) {
                console.error("Sign out error:", signOutError);
            }
        } finally {
            this.setLoading(false);
        }
    }

    async submitApplicationWithUser(user) {
        this.setLoading(true);
        try {
            // Submit application with the authenticated user
            await NutritionistApplicationRepository.submitNutritionistApplication(
                this.application, 
                this.document,
                user.uid // Pass the user ID directly
            );
            
            // Sign out after successful submission
            const auth = getAuth();
            await signOut(auth);
            
            this.setShowPendingApprovalModal(true);
            this.resetForm();
        } catch (error) {
            console.error("Application submission error:", error);
            this.setError(error.message || 'Submission failed.');
            
            // Sign out on error too
            try {
                const auth = getAuth();
                await signOut(auth);
            } catch (signOutError) {
                console.error("Sign out error:", signOutError);
            }
        } finally {
            this.setLoading(false);
        }
    }

    async resendVerificationEmail() {
    if (!this.tempUser) {
        this.setError('No verification in progress.');
        return;
    }

    this.setLoading(true);
    this.setError('');

    try {
        const auth = getAuth();
        
        // Sign in to resend verification
        const userCredential = await signInWithEmailAndPassword(
            auth,
            this.application.email,
            this.application.password
        );
        
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        
        // Use custom alert instead of browser alert
        const message = 'Verification email sent again. Please check your email.';
        if (window.showSuccess) {
            window.showSuccess(message);
        } else {
            alert(message); // Fallback
        }
    } catch (error) {
        console.error("Resend verification error:", error);
        this.setError('Failed to resend verification email.');
    } finally {
        this.setLoading(false);
    }
}

    async submitApplication() {
        this.setLoading(true);
        try {
            // Submit application - user should be signed in at this point
            await NutritionistApplicationRepository.submitNutritionistApplication(
                this.application, 
                this.document,
                null // Don't pass userUid, let it use the currently signed-in user
            );
            
            // Sign out after successful submission
            const auth = getAuth();
            await signOut(auth);
            
            this.setShowPendingApprovalModal(true);
            this.resetForm();
        } catch (error) {
            console.error("Application submission error:", error);
            this.setError(error.message || 'Submission failed.');
            
            // Sign out on error too
            try {
                const auth = getAuth();
                await signOut(auth);
            } catch (signOutError) {
                console.error("Sign out error:", signOutError);
            }
        } finally {
            this.setLoading(false);
        }
    }

    resetForm() {
        this.application = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            dob: '',
        };
        this.document = null;
        this.agreedToTerms = false;
        this.isEmailVerified = false;
        this.tempUser = null;
        this.verifiedUserId = null;
        const fileInput = document.getElementById('certificate-upload');
        if (fileInput) fileInput.value = '';
    }

    async viewCertificate(userId) {
    this.setLoading(true);
    this.setError('');

    try {
        const auth = getAuth();
        const user = auth.currentUser;

        console.log('user', user);

        if (!user) {
            const errorMessage = "Please log in to view the certificate.";
            this.setError(errorMessage);
            
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); // Fallback
            }
            return;
        }

        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.admin !== true) {
            const errorMessage = "Access Denied: You must be an administrator to view this certificate.";
            this.setError(errorMessage);
            
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); // Fallback
            }
            return;
        }

        const url = await NutritionistApplicationRepository.getNutritionistCertificateUrl(userId);
        if (url) {
            window.open(url, '_blank');
        } else {
            const errorMessage = "Certificate URL not found for this user.";
            this.setError(errorMessage);
            
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); // Fallback
            }
        }

    } catch (error) {
        console.error("viewCertificate error:", error);
        const errorMessage = `Failed to fetch certificate: ${error.message}`;
        this.setError(errorMessage);
        
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage); // Fallback
        }
    } finally {
        this.setLoading(false);
    }
}

async approveNutritionist(userId) {
    this.setLoading(true);
    this.setError('');

    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            const errorMessage = "Please log in as an administrator.";
            this.setError("No user logged in.");
            
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); // Fallback
            }
            return;
        }

        const token = await user.getIdTokenResult(true);
        if (!token.claims.admin) {
            const errorMessage = "Access Denied: You must be an administrator.";
            this.setError("Unauthorized");
            
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); // Fallback
            }
            return;
        }

        await nutritionistApplicationRepository.approveNutritionist(userId);
        await AdminDashboardViewModel.fetchAccounts(); 

        // Custom success message for approval
        const successMessage = "Nutritionist account has been approved and notification email sent!";
        
        if (window.showSuccess) {
            window.showSuccess(successMessage);
        } else {
            alert(successMessage); // Fallback
        }
    } catch (error) {
        console.error("Error approving nutritionist:", error);
        this.setError(error.message || "Approval failed.");
        
        const errorMessage = `Failed to approve nutritionist: ${error.message}`;
        
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage); // Fallback
        }
    } finally {
        this.setLoading(false);
    }
}

async rejectNutritionist(userId, rejectionReason = '') {
    this.setLoading(true);
    this.setError('');

    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            const errorMessage = "Please log in as an administrator.";
            this.setError("No user logged in.");
            
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); // Fallback
            }
            return;
        }

        const token = await user.getIdTokenResult(true);
        if (!token.claims.admin) {
            const errorMessage = "Access Denied: You must be an administrator.";
            this.setError("Unauthorized");
            
            if (window.showError) {
                window.showError(errorMessage);
            } else {
                alert(errorMessage); // Fallback
            }
            return;
        }

        await nutritionistApplicationRepository.rejectNutritionist(userId, rejectionReason);
        await AdminDashboardViewModel.fetchAccounts(); 

        // Custom success message for rejection
        const successMessage = "Nutritionist application has been rejected and notification email sent!";
        
        if (window.showSuccess) {
            window.showSuccess(successMessage);
        } else {
            alert(successMessage); // Fallback
        }
    } catch (error) {
        console.error("Error rejecting nutritionist:", error);
        this.setError(error.message || "Rejection failed.");
        
        const errorMessage = `Failed to reject nutritionist: ${error.message}`;
        
        if (window.showError) {
            window.showError(errorMessage);
        } else {
            alert(errorMessage); // Fallback
        }
    } finally {
        this.setLoading(false);
    }
}
}

export default NutritionistApplicationViewModel;