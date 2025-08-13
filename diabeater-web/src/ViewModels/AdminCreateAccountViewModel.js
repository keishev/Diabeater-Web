// ViewModels/AdminCreateAccountViewModel.js - IMPROVED VERSION
import { makeAutoObservable, runInAction } from 'mobx';
import AdminCreateAccountRepository from '../Repositories/AdminCreateAccountRepository';
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
  pendingAccounts = [];
  verificationLink = ''; // Store the verification link

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
    this.verificationLink = '';
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
    }, 5000);
  };

  setCreatedAccount = (account) => { this.createdAccount = account; };
  setPendingAccounts = (accounts) => { this.pendingAccounts = accounts; };
  setEmailSent = (value) => { this.emailSent = value; };
  setEmailVerified = (value) => { this.emailVerified = value; };
  setAccountCreated = (value) => { this.accountCreated = value; };
  setVerificationLink = (link) => { this.verificationLink = link; };

  // --- Computed Properties ---
  get isFormValid() {
    const validation = AdminCreateAccountRepository.validateAdminForm(this.formData);
    return validation.isValid;
  }

  get canSendVerificationEmail() {
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

  get canCreateAccount() {
    return this.emailVerified && 
           !this.accountCreated && 
           !this.isCreating && 
           !this.isCheckingVerification && 
           !this.isSendingVerification;
  }

  // --- Actions ---

  /**
   * Step 1: Send verification email (simplified)
   */
  sendVerificationEmail = async () => {
    this.setGlobalError('');
    this.setSuccessMessage('');
    
    // Validate form first
    const validation = AdminCreateAccountRepository.validateAdminForm(this.formData);
    if (!validation.isValid) {
      runInAction(() => {
        this.setErrors(validation.errors);
      });
      return;
    }

    this.setSendingVerification(true);
    
    try {
      console.log('Creating admin account and sending verification email...');
      const result = await AdminCreateAccountRepository.createAdminAccount(this.formData);
      
      runInAction(() => {
        if (result.success) {
          this.setEmailSent(true);
          this.setVerificationLink(result.verificationLink);
          this.setSuccessMessage(
            `Admin account created! A verification email should be sent to ${this.formData.email}. ` +
            `Please check your email and click the verification link to continue.`
          );
          console.log('Admin account created successfully');
        } else {
          this.setGlobalError('Failed to create admin account');
        }
      });

    } catch (error) {
      console.error('Error creating admin account:', error);
      runInAction(() => {
        let errorMessage = error.message || 'Failed to create admin account';
        
        // Handle common Firebase errors
        if (error.message?.includes('email-already-in-use')) {
          errorMessage = 'This email is already in use. Please use a different email address.';
        } else if (error.message?.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message?.includes('weak-password')) {
          errorMessage = 'Password should be at least 6 characters long.';
        } else if (error.message?.includes('permission-denied')) {
          errorMessage = 'You do not have permission to create admin accounts.';
        }
        
        this.setGlobalError(errorMessage);
      });
    } finally {
      runInAction(() => {
        this.setSendingVerification(false);
      });
    }
  };

  /**
   * Step 2: Check if email is verified
   */
  checkEmailVerification = async () => {
    this.setGlobalError('');
    this.setSuccessMessage('');
    this.setCheckingVerification(true);

    try {
      const result = await AdminCreateAccountService.checkEmailVerification(
        this.formData.email, 
        this.formData.password
      );
      
      runInAction(() => {
        if (result.success && result.isVerified) {
          this.setEmailVerified(true);
          this.setSuccessMessage('Email verified successfully! You can now create the admin account.');
        } else {
          this.setGlobalError('Email not yet verified. Please check your email and click the verification link.');
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
   * Step 3: Complete admin account creation
   */
  createAdminAccount = async () => {
    this.setGlobalError('');
    this.setSuccessMessage('');
    this.setCreating(true);
    
    try {
      const result = await AdminCreateAccountRepository.createFinalAdminAccount(this.formData);
      
      runInAction(() => {
        if (result.success) {
          this.setAccountCreated(true);
          this.setCreatedAccount({
            userId: result.userId,
            email: this.formData.email
          });
          this.setSuccessMessage('Admin account created successfully! The account is now active and ready to use.');
        } else {
          this.setGlobalError('Failed to create admin account');
        }
      });

      await this.fetchPendingAccounts();

    } catch (error) {
      console.error('Error creating admin account:', error);
      runInAction(() => {
        this.setGlobalError(error.message || 'Failed to create admin account');
      });
    } finally {
      runInAction(() => {
        this.setCreating(false);
      });
    }
  };

  /**
   * Resend verification - simplified approach
   */
  resendVerificationEmail = async () => {
    this.setSendingVerification(true);
    this.setGlobalError('');

    try {
      const result = await AdminCreateAccountService.resendVerificationEmail(
        this.formData.email,
        this.formData.password
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
        this.setGlobalError(error.message || 'Please check your email for the original verification link');
      });
    } finally {
      runInAction(() => {
        this.setSendingVerification(false);
      });
    }
  };

  /**
   * Open verification link in new tab (for testing/convenience)
   */
  openVerificationLink = () => {
    if (this.verificationLink) {
      window.open(this.verificationLink, '_blank');
    }
  };

  /**
   * Fetch pending accounts
   */
  fetchPendingAccounts = async () => {
    this.setLoading(true);
    try {
      const pending = await AdminCreateAccountRepository.getPendingAdminAccounts();
      runInAction(() => {
        this.setPendingAccounts(pending);
      });
    } catch (error) {
      console.error('Error fetching pending accounts:', error);
      runInAction(() => {
        this.setGlobalError(error.message || 'Failed to fetch pending accounts');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
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