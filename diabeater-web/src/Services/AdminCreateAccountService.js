// services/AdminCreateAccountService.js - SIMPLIFIED
import { getFunctions, httpsCallable } from 'firebase/functions';

const AdminCreateAccountService = {
  /**
   * Creates admin account and gets verification link
   */
  async createAdminAccount(adminData) {
    try {
      const { firstName, lastName, email, password, dob } = adminData;
      
      // Validation
      if (!email?.trim()) throw new Error('Email is required');
      if (!firstName?.trim()) throw new Error('First name is required');
      if (!lastName?.trim()) throw new Error('Last name is required');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');
      if (!dob) throw new Error('Date of birth is required');
      
      console.log('Creating admin account via Cloud Function...');
      
      const functions = getFunctions();
      const createAdminWithVerification = httpsCallable(functions, 'createAdminWithVerification');
      
      const result = await createAdminWithVerification({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password,
        dob: dob
      });
      
      if (result.data.success) {
        // You can either:
        // 1. Return the verification link and let frontend handle email sending
        // 2. Or just return success and let user know to check their email
        
        console.log('Admin account created. Verification link:', result.data.verificationLink);
        
        return {
          success: true,
          email: result.data.email,
          uid: result.data.uid,
          verificationLink: result.data.verificationLink,
          message: 'Admin account created. Please check your email for verification link.'
        };
      } else {
        throw new Error(result.data.error || 'Failed to create admin account');
      }
      
    } catch (error) {
      console.error('Error creating admin account:', error);
      
      if (error.code && error.message) {
        throw new Error(error.message);
      }
      
      throw new Error(error.message || 'Failed to create admin account');
    }
  },

  /**
   * Checks email verification status
   */
  async checkEmailVerification(email, password) {
    try {
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      
      const functions = getFunctions();
      const checkEmailVerification = httpsCallable(functions, 'checkEmailVerification');
      const result = await checkEmailVerification({ email: email.trim() });
      
      return result.data;
      
    } catch (error) {
      console.error('Error checking email verification:', error);
      
      if (error.code && error.message) {
        throw new Error(error.message);
      }
      
      throw new Error(`Failed to check verification status: ${error.message}`);
    }
  },

  /**
   * For resending, we can just regenerate the verification link
   */
  async resendVerificationEmail(email, password) {
    try {
      if (!email?.trim()) {
        throw new Error('Email is required');
      }

      // For now, just tell user to check spam or use the original link
      // You could also implement a resend function in your cloud functions if needed
      
      return {
        success: true,
        message: 'Please check your email (including spam folder) for the verification link. The link should still be valid.'
      };

    } catch (error) {
      console.error('Error with resend request:', error);
      throw new Error('Please check your email for the original verification link');
    }
  },

  /**
   * Form validation
   */
  validateAdminForm(formData) {
    const errors = {};
    
    if (!formData.firstName?.trim() || formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName?.trim() || formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword || formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      
      if (age < 18) {
        errors.dob = 'Admin must be at least 18 years old';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default AdminCreateAccountService;