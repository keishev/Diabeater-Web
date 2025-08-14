// ViewModels/AdminCreateAccountViewModel.js - SIMPLIFIED CLIENT-SIDE VERSION
import { makeAutoObservable, runInAction } from 'mobx';
import AdminCreateAccountService from '../Services/AdminCreateAccountService';

class AdminCreateAccountViewModel {
  // Form data
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: ''
  };

  // UI state
  isLoading = false;
  isCreating = false;
  isCheckingVerification = false;
  isSendingVerification = false;
  
  // Error handling
  errors = {};
  globalError = '';
  successMessage = '';

  // Account creation flow state
  accountCreated = false;
  emailSent = false;
  emailVerified = false;
  createdAccount = null;
  
  // Password storage for resend functionality
  temporaryPassword = '';

  constructor() {
    makeAutoObservable(this);
  }

  // --- Form Management ---
  setFormField = (field, value) => {
    this.formData[field] = value;
    if (this.errors[field]) {
      delete this.errors[field];
    }
  };

  clearForm = () => {
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dob: ''
    };
    this.errors = {};
    this.globalError = '';
    this.successMessage = '';
    this.emailSent = false;
    this.emailVerified = false;
    this.accountCreated = false;
    this.createdAccount = null;
    this.temporaryPassword = '';
  };

  // --- State Management ---
  setLoading = (value) => { this.isLoading = value; };
  setCreating = (value) => { this.isCreating = value; };
  setCheckingVerification = (value) => { this.isCheckingVerification = value; };
  setSendingVerification = (value) => { this.isSendingVerification = value; };
  setErrors = (errors) => { this.errors = errors; };
  setGlobalError = (message) => { this.globalError = message; };
  
  setSuccessMessage = (message) => {
    this.successMessage = message;
    setTimeout(() => {
      runInAction(() => {
        this.successMessage = '';
      });
    }, 8000);
  };

  setCreatedAccount = (account) => { this.createdAccount = account; };
  setEmailSent = (value) => { this.emailSent = value; };
  setEmailVerified = (value) => { this.emailVerified = value; };
  setAccountCreated = (value) => { this.accountCreated = value; };
  setTemporaryPassword = (password) => { this.temporaryPassword = password; };

  // --- Computed Properties ---
  get isFormValid() {
    const validation = AdminCreateAccountService.validateAdminForm(this.formData);
    return validation.isValid;
  }

  get canCreateAccount() {
    return this.isFormValid && 
           !this.emailSent && 
           !this.accountCreated &&
           !this.isSendingVerification && 
           !this.isCheckingVerification && 
           !this.isCreating;
  }

  get canCheckVerification() {
    return this.emailSent && 
           !this.emailVerified && 
           !this.accountCreated &&
           !this.isCheckingVerification && 
           !this.isSendingVerification && 
           !this.isCreating;
  }

  get canResendEmail() {
    return this.emailSent && 
           !this.emailVerified && 
           !this.accountCreated &&
           !this.isSendingVerification;
  }

  // --- Actions ---

  /**
   * Create admin account via cloud function (no client auth operations)
   */
  createAdminAccount = async () => {
    this.setGlobalError('');
    this.setSuccessMessage('');
    
    // Validate form first
    const validation = AdminCreateAccountService.validateAdminForm(this.formData);
    if (!validation.isValid) {
      runInAction(() => {
        this.setErrors(validation.errors);
      });
      return;
    }

    this.setCreating(true);
    
    try {
      console.log('Creating admin account via cloud function (no session change)...');
      const result = await AdminCreateAccountService.createAdminAccount(this.formData);
      
      runInAction(() => {
        if (result.success) {
          this.setEmailSent(true);
          this.setCreatedAccount({
            uid: result.uid,
            email: result.email
          });
          
          this.setSuccessMessage(result.message);
          console.log('Admin account created via cloud function - current session preserved');
        } else {
          this.setGlobalError('Failed to create admin account');
        }
      });

    } catch (error) {
      console.error('Error creating admin account:', error);
      runInAction(() => {
        this.setGlobalError(error.message || 'Failed to create admin account. Please try again.');
      });
    } finally {
      runInAction(() => {
        this.setCreating(false);
      });
    }
  };

  /**
   * Check if Firebase email is verified (still uses cloud function for admin claims)
   */
  checkEmailVerification = async () => {
    this.setGlobalError('');
    this.setSuccessMessage('');
    this.setCheckingVerification(true);

    try {
      const result = await AdminCreateAccountService.checkEmailVerification(this.formData.email);
      
      runInAction(() => {
        if (result.success && result.isVerified) {
          this.setEmailVerified(true);
          this.setAccountCreated(true);
          this.setSuccessMessage('🎉 ' + result.message + ' The admin account is now ready to use!');
          // Clear temporary password after successful verification
          this.setTemporaryPassword('');
        } else {
          this.setGlobalError(result.message || 'Email not yet verified. Please check your email and click the verification link.');
        }
      });

    } catch (error) {
      console.error('Error checking email verification:', error);
      runInAction(() => {
        this.setGlobalError(error.message || 'Failed to check email verification');
      });
    } finally {
      runInAction(() => {
        this.setCheckingVerification(false);
      });
    }
  };

  /**
   * Resend Firebase verification email via simple cloud function (no session issues)
   */
  resendVerificationEmail = async () => {
    this.setSendingVerification(true);
    this.setGlobalError('');

    try {
      console.log('Resending verification email via cloud function (no session conflicts)...');
      
      const result = await AdminCreateAccountService.resendVerificationEmail(
        this.formData.email
      );
      
      runInAction(() => {
        if (result.success) {
          this.setSuccessMessage(result.message);
        } else {
          this.setGlobalError(result.message || 'Failed to resend verification email');
        }
      });

    } catch (error) {
      console.error('Error resending verification email:', error);
      runInAction(() => {
        this.setGlobalError(error.message || 'Failed to resend verification email');
      });
    } finally {
      runInAction(() => {
        this.setSendingVerification(false);
      });
    }
  };

  clearMessages = () => {
    this.globalError = '';
    this.successMessage = '';
    this.errors = {};
  };

  resetFlow = () => {
    this.clearForm();
    this.setEmailSent(false);
    this.setEmailVerified(false);
    this.setAccountCreated(false);
    this.clearMessages();
  };
}

export default new AdminCreateAccountViewModel();