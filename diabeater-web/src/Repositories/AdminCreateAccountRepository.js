
import AdminCreateAccountService from '../Services/AdminCreateAccountService';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

class AdminCreateAccountRepository {
  async createAdminAccount(adminData) {
    try {
      return await AdminCreateAccountService.createAdminAccount(adminData);
    } catch (error) {
      console.error('Repository: Error creating admin account:', error);
      throw error;
    }
  }
  async checkEmailVerification(email) {
    try {
      return await AdminCreateAccountService.checkEmailVerification(email);
    } catch (error) {
      console.error('Repository: Error checking email verification:', error);
      throw error;
    }
  }

  async resendVerificationEmail(email) {
    try {
      return await AdminCreateAccountService.resendVerificationEmail(email);
    } catch (error) {
      console.error('Repository: Error resending verification email:', error);
      throw error;
    }
  }


  validateAdminForm(formData) {
    return AdminCreateAccountService.validateAdminForm(formData);
  }
}

export default new AdminCreateAccountRepository();