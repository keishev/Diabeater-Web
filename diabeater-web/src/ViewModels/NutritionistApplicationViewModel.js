// src/ViewModels/NutritionistApplicationViewModel.js
import { makeAutoObservable } from 'mobx';
import NutritionistRepository from '../Repositories/NutritionistRepository';

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
            await NutritionistRepository.submitNutritionistApplication(this.application, this.document);
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
}

export default NutritionistApplicationViewModel;
