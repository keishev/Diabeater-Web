// ViewModels/AdminCreateAccountViewModel.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminCreateAccountRepository from '../Repositories/AdminCreateAccountRepository';

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
  isSettingClaims = false;
  isSendingVerification = false;
  
  // Error handling
  errors = {};
  globalError = '';
  successMessage = '';

  // Account creation flow state
  emailSent = false;
  emailVerified = false;
  accountCreated = false;
  createdAccount = null;
  pendingAccounts = [];

  constructor() {
    makeAutoObservable(this);
  }

  // --- Form Management ---
  setFormField = (field, value) => {
    this.formData[field] = value;
    // Clear field error when user starts typing
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
  };

  // --- State Management ---
  setLoading = (value) => {
    this.isLoading = value;
  };

  setCreating = (value) => {
    this.isCreating = value;
  };

  setCheckingVerification = (value) => {
    this.isCheckingVerification = value;
  };

  setSettingClaims = (value) => {
    this.isSettingClaims = value;
  };

  setSendingVerification = (value) => {
    this.isSendingVerification = value;
  };

  setErrors = (errors) => {
    this.errors = errors;
  };

  setGlobalError = (message) => {
    this.globalError = message;
  };

  setSuccessMessage = (message) => {
    this.successMessage = message;
    // Clear success message after 5 seconds
    setTimeout(() => {
      runInAction(() => {
        this.successMessage = '';
      });
    }, 5000);
  };

  setCreatedAccount = (account) => {
    this.createdAccount = account;
  };

  setPendingAccounts = (accounts) => {
    this.pendingAccounts = accounts;
  };

  setEmailSent = (value) => {
    this.emailSent = value;
  };

  setEmailVerified = (value) => {
    this.emailVerified = value;
  };

  setAccountCreated = (value) => {
    this.accountCreated = value;
  };

  // --- Computed Properties ---
  get isFormValid() {
    const validation = AdminCreateAccountRepository.validateAdminForm(this.formData);
    return validation.isValid;
  }

  get canSendVerificationEmail() {
    // Can send if form is valid and email hasn't been sent yet
    return this.isFormValid && 
           !this.emailSent && 
           !this.isSendingVerification && 
           !this.isCheckingVerification && 
           !this.isCreating;
  }

  get canCheckVerification() {
    // Can check if email was sent but not yet verified
    return this.emailSent && 
           !this.emailVerified && 
           !this.isCheckingVerification && 
           !this.isSendingVerification && 
           !this.isCreating;
  }

  get canCreateAccount() {
    // Can create account only after email is verified
    return this.emailVerified && 
           !this.accountCreated && 
           !this.isCreating && 
           !this.isCheckingVerification && 
           !this.isSendingVerification;
  }

  // --- Actions ---

  /**
   * Step 1: Send verification email (without creating account yet)
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
      // Check if email already exists
      const emailExists = await AdminCreateAccountRepository.checkEmailExists(this.formData.email);
      if (emailExists) {
        runInAction(() => {
          this.setErrors({ email: 'An account with this email already exists' });
        });
        return;
      }

      // Send verification email without creating account
      const result = await AdminCreateAccountRepository.sendVerificationEmail(this.formData.email);
      
      runInAction(() => {
        if (result.success) {
          this.setEmailSent(true);
          this.setSuccessMessage(`Verification email sent to ${this.formData.email}. Please check your email and click the verification link.`);
        } else {
          this.setGlobalError('Failed to send verification email');
        }
      });

    } catch (error) {
      console.error('Error sending verification email:', error);
      runInAction(() => {
        this.setGlobalError(error.message || 'Failed to send verification email');
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
      const result = await AdminCreateAccountRepository.checkEmailVerification(this.formData.email);
      
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
   * Step 3: Create admin account (only after email is verified)
   */
  createAdminAccount = async () => {
    this.setGlobalError('');
    this.setSuccessMessage('');
    this.setCreating(true);
    
    try {
      // Create the account
      const result = await AdminCreateAccountRepository.createAdminAccount(this.formData);
      
      runInAction(() => {
        this.setCreatedAccount(result);
        this.setAccountCreated(true);
        this.setSuccessMessage('Admin account created successfully! The account is now active and ready to use.');
        this.clearForm();
      });

      // Refresh pending accounts list
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
   * Resend verification email for the current form email
   */
  resendVerificationEmail = async () => {
    this.setSendingVerification(true);
    this.setGlobalError('');

    try {
      const result = await AdminCreateAccountRepository.resendVerificationEmail(this.formData.email);
      
      runInAction(() => {
        if (result.success) {
          this.setSuccessMessage('Verification email resent successfully to ' + this.formData.email);
        } else {
          this.setGlobalError('Failed to resend verification email');
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

  /**
   * Fetches pending admin accounts
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

  /**
   * Clears all messages and errors
   */
  clearMessages = () => {
    this.globalError = '';
    this.successMessage = '';
    this.errors = {};
  };

  /**
   * Helper method to get email for verification
   */
  getEmailForVerification = () => {
    return this.formData.email || null;
  };

  /**
   * Reset the entire flow to start over
   */
  resetFlow = () => {
    this.clearForm();
    this.setEmailSent(false);
    this.setEmailVerified(false);
    this.setAccountCreated(false);
    this.clearMessages();
  };
}

export default new AdminCreateAccountViewModel();