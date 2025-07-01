// src/ViewModels/NutritionistApplicationViewModel.js
import { makeAutoObservable } from 'mobx';
import NutritionistApplicationRepository from '../Repositories/NutritionistApplicationRepository';
import { getAuth } from 'firebase/auth'; // Ensure getAuth is imported
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
    isLoading = false;

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

    setLoading(val) {
        this.isLoading = val;
    }

    setError(msg) {
        this.error = msg;
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

    async submitApplication() {
        if (!this.validate()) return;

        this.setLoading(true);
        try {
            await NutritionistApplicationRepository.submitNutritionistApplication(this.application, this.document);
            this.setShowPendingApprovalModal(true);
            this.resetForm();
        } catch (error) {
            this.setError(error.message || 'Submission failed.');
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
                this.setError("Please log in to view the certificate.");
                alert("Please log in to view the certificate.");
                return;
            }

            const idTokenResult = await user.getIdTokenResult(true);
            if (idTokenResult.claims.admin !== true) {
                this.setError("Access Denied: You must be an administrator to view this certificate.");
                alert("Access Denied: You must be an administrator to view this certificate.");
                return;
            }

            const url = await NutritionistApplicationRepository.getNutritionistCertificateUrl(userId);
            if (url) {
                window.open(url, '_blank');
            } else {
                this.setError("Certificate URL not found.");
                alert("Certificate URL not found for this user.");
            }

        } catch (error) {
            console.error("viewCertificate error:", error);
            this.setError(`Failed to fetch certificate: ${error.message}`);
            alert(`Failed to fetch certificate: ${error.message}`);
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
                alert("Please log in as an administrator.");
                this.setError("No user logged in.");
                return;
            }

            const token = await user.getIdTokenResult(true);
            if (!token.claims.admin) {
                alert("Access Denied: You must be an administrator.");
                this.setError("Unauthorized");
                return;
            }

            await nutritionistApplicationRepository.approveNutritionist(userId);
            await AdminDashboardViewModel.fetchAccounts(); 

            alert("Nutritionist has been approved!");
        } catch (error) {
            console.error("Error approving nutritionist:", error);
            this.setError(error.message || "Approval failed.");
            alert(`Failed to approve: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async rejectNutritionist(userId) {
        this.setLoading(true);
        this.setError('');

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                alert("Please log in as an administrator.");
                this.setError("No user logged in.");
                return;
            }

            const token = await user.getIdTokenResult(true);
            if (!token.claims.admin) {
                alert("Access Denied: You must be an administrator.");
                this.setError("Unauthorized");
                return;
            }

            await nutritionistApplicationRepository.rejectNutritionist(userId, this.rejectionReason || "");
            await AdminDashboardViewModel.fetchAccounts(); 

            alert("Nutritionist has been rejected!");
        } catch (error) {
            console.error("Error rejecting nutritionist:", error);
            this.setError(error.message || "Rejection failed.");
            alert(`Failed to reject: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }
}

export default  NutritionistApplicationViewModel;
