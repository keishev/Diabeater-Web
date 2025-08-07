// src/viewmodels/ResetPasswordViewModel.js
import { makeObservable, observable, action } from 'mobx';
import AuthRepository from '../Repositories/AuthRepository';

class ResetPasswordViewModel {
    email = '';
    message = '';
    error = '';
    isLoading = false;

    constructor() {
        // Initialize MobX observables and actions using makeObservable
        makeObservable(this, {
            email: observable,
            message: observable,
            error: observable,
            isLoading: observable,
            setEmail: action,
            handleSubmit: action
        });
    }

    // Action to update the email input state
    setEmail(email) {
        this.email = email;
    }

    // Main action to handle the password reset submission
    async handleSubmit() {
        this.message = '';
        this.error = '';
        this.isLoading = true;

        if (!this.email) {
            this.error = 'Please enter your email address.';
            this.isLoading = false;
            return;
        }

        const result = await AuthRepository.requestPasswordReset(this.email);

        if (result.success) {
            this.message = result.message || 'If an account with that email exists, a password reset link has been sent to your email.';
            this.email = '';
        } else {
            this.error = result.error || 'An unexpected error occurred. Please try again.';
        }

        this.isLoading = false;
    }
}

// Export a singleton instance of the ViewModel
export default new ResetPasswordViewModel();