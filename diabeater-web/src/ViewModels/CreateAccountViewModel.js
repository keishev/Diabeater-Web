// src/ViewModels/CreateAccountViewModel.js
import { makeAutoObservable } from 'mobx';
import nutritionistRepository from '../Repositories/NutritionistRepository';

class CreateAccountViewModel {
    firstName = '';
    lastName = '';
    email = '';
    dob = '';
    password = '';
    confirmPassword = '';
    certificateFile = null;
    agreedToTerms = false;

    error = '';
    showInfoModal = false;
    showPendingApprovalModal = false;
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    setFirstName(value) {
        this.firstName = value;
    }

    setLastName(value) {
        this.lastName = value;
    }

    setEmail(value) {
        this.email = value;
    }

    setDob(value) {
        this.dob = value;
    }

    setPassword(value) {
        this.password = value;
    }

    setConfirmPassword(value) {
        this.confirmPassword = value;
    }

    setCertificateFile(file) {
        if (file && file.type === 'application/pdf') {
            this.certificateFile = file;
            this.setError('');
        } else {
            this.certificateFile = null;
            this.setError('Please upload a valid PDF file for your certificate.');
        }
    }

    setAgreedToTerms(checked) {
        this.agreedToTerms = checked;
    }

    setError(message) {
        this.error = message;
    }

    setShowInfoModal(value) {
        this.showInfoModal = value;
    }

    setShowPendingApprovalModal(value) {
        this.showPendingApprovalModal = value;
    }

    setLoading(value) {
        this.isLoading = value;
    }

    validateForm() {
        if (!this.firstName || !this.lastName || !this.email || !this.dob || !this.password || !this.confirmPassword) {
            this.setError('All fields are required.');
            return false;
        }
        if (this.password.length < 6) {
            this.setError('Password must be at least 6 characters long.');
            return false;
        }
        if (this.password !== this.confirmPassword) {
            this.setError('Passwords do not match.');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            this.setError('Please enter a valid email address.');
            return false;
        }
        if (!this.certificateFile) {
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

    async handleSubmit() {
        this.setError('');
        if (!this.validateForm()) {
            return;
        }

        this.setLoading(true);
        try {
            const userData = {
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email,
                dob: this.dob,
                password: this.password, // This password is for Firebase Auth, not stored directly in Firestore
            };

            await nutritionistRepository.createNutritionistAccount(userData, this.certificateFile);
            this.setShowPendingApprovalModal(true);
            this.resetForm(); // Clear form on successful submission

        } catch (error) {
            console.error("Account creation failed:", error);
            // Firebase error codes can be more specific, e.g., 'auth/email-already-in-use'
            if (error.code === 'auth/email-already-in-use') {
                this.setError('The email address is already in use by another account.');
            } else {
                this.setError(`Failed to create account: ${error.message || 'An unexpected error occurred.'}`);
            }
        } finally {
            this.setLoading(false);
        }
    }

    resetForm() {
        this.setFirstName('');
        this.setLastName('');
        this.setEmail('');
        this.setDob('');
        this.setPassword('');
        this.setConfirmPassword('');
        this.setCertificateFile(null);
        this.setAgreedToTerms(false);
        if (document.getElementById('certificate-upload')) {
            document.getElementById('certificate-upload').value = ''; // Clear file input
        }
    }
}

export default CreateAccountViewModel;