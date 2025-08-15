
import { makeObservable, observable, action } from 'mobx';
import AuthRepository from '../Repositories/AuthRepository';

class ResetPasswordViewModel {
    email = '';
    message = '';
    error = '';
    isLoading = false;

    constructor() {
        
        makeObservable(this, {
            email: observable,
            message: observable,
            error: observable,
            isLoading: observable,
            setEmail: action,
            handleSubmit: action
        });
    }

    
    setEmail(email) {
        this.email = email;
    }

    
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


export default new ResetPasswordViewModel();