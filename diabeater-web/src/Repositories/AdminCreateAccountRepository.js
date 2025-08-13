// repositories/AdminCreateAccountRepository.js
import AdminCreateAccountService from '../Services/AdminCreateAccountService';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

class AdminCreateAccountRepository {
  /**
   * Creates a new admin account
   * @param {Object} adminData - Admin account data
   * @returns {Promise<Object>} - Creation result
   */
  async createAdminAccount(adminData) {
    try {
      return await AdminCreateAccountService.createAdminAccount(adminData);
    } catch (error) {
      console.error('Repository: Error creating admin account:', error);
      throw error;
    }
  }

  /**
   * Checks if email is already in use
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - True if email exists
   */
  async checkEmailExists(email) {
    try {
      const usersQuery = query(
        collection(db, 'user_accounts'),
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Repository: Error checking email existence:', error);
      throw new Error('Failed to check email availability');
    }
  }

  /**
   * Sends verification email before account creation
   * @param {string} email - Email to send verification to
   * @returns {Promise<Object>} - Result of sending email
   */
  async sendVerificationEmail(email) {
    try {
      console.log('Sending verification email to:', email);

      // Using HTTP request instead of callable function due to CORS
      const response = await fetch(`${process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 'https://us-central1-diabeaters-4cf9e.cloudfunctions.net'}/sendVerificationEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification email');
      }

      return result;

    } catch (error) {
      console.error('Repository: Error sending verification email:', error);
      
      // Provide more specific error messages
      if (error.message.includes('CORS')) {
        throw new Error('Network configuration error. Please contact support.');
      } else if (error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Resends verification email to user
   * @param {string} email - Email to send verification to
   * @returns {Promise<Object>} - Result of sending email
   */
  async resendVerificationEmail(email) {
    try {
      console.log('Resending verification email to:', email);

      const response = await fetch(`${process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 'https://us-central1-diabeaters-4cf9e.cloudfunctions.net'}/resendVerificationEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to resend verification email');
      }

      return result;

    } catch (error) {
      console.error('Repository: Error resending verification email:', error);
      throw new Error(`Failed to resend verification email: ${error.message}`);
    }
  }

  /**
   * Checks email verification status
   * @param {string} email - Email to check
   * @returns {Promise<Object>} - Verification status
   */
  async checkEmailVerification(email) {
    try {
      console.log('Checking email verification for:', email);

      const response = await fetch(`${process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 'https://us-central1-diabeaters-4cf9e.cloudfunctions.net'}/checkEmailVerification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to check verification status');
      }

      return result;

    } catch (error) {
      console.error('Repository: Error checking email verification:', error);
      throw new Error(`Failed to check verification status: ${error.message}`);
    }
  }

  /**
   * Sets admin claims for verified user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result of setting claims
   */
  async setAdminClaims(userId) {
    try {
      console.log('Setting admin claims for user:', userId);
      
      const setAdminClaimsFunction = httpsCallable(functions, 'setAdminClaims');
      const result = await setAdminClaimsFunction({ uid: userId });
      
      return result.data;
      
    } catch (error) {
      console.error('Repository: Error setting admin claims:', error);
      throw new Error(`Failed to set admin claims: ${error.message}`);
    }
  }

  /**
   * Gets pending admin accounts (those created but not yet activated)
   * @returns {Promise<Array>} - List of pending admin accounts
   */
  async getPendingAdminAccounts() {
    try {
      const pendingQuery = query(
        collection(db, 'user_accounts'),
        where('role', '==', 'admin'),
        where('status', '==', 'Pending')
      );
      
      const querySnapshot = await getDocs(pendingQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Repository: Error getting pending admin accounts:', error);
      throw new Error('Failed to fetch pending admin accounts');
    }
  }

  /**
   * Validates form data using service
   * @param {Object} formData - Form data to validate
   * @returns {Object} - Validation result
   */
  validateAdminForm(formData) {
    return AdminCreateAccountService.validateAdminForm(formData);
  }
}

export default new AdminCreateAccountRepository();