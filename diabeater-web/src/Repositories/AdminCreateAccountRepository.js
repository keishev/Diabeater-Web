// repositories/AdminCreateAccountRepository.js - SIMPLIFIED
import AdminCreateAccountService from '../Services/AdminCreateAccountService';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

class AdminCreateAccountRepository {
  /**
   * Creates admin account (delegates to service)
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
   * Checks email verification status (delegates to service)
   */
  async checkEmailVerification(email) {
    try {
      return await AdminCreateAccountService.checkEmailVerification(email);
    } catch (error) {
      console.error('Repository: Error checking email verification:', error);
      throw error;
    }
  }

  /**
   * Resends verification email (delegates to service)
   */
  async resendVerificationEmail(email) {
    try {
      return await AdminCreateAccountService.resendVerificationEmail(email);
    } catch (error) {
      console.error('Repository: Error resending verification email:', error);
      throw error;
    }
  }


  /**
   * Validates form data (delegates to service)
   */
  validateAdminForm(formData) {
    return AdminCreateAccountService.validateAdminForm(formData);
  }
}

export default new AdminCreateAccountRepository();