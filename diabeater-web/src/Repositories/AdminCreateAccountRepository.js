// repositories/AdminCreateAccountRepository.js - SIMPLIFIED
import AdminCreateAccountService from '../Services/AdminCreateAccountService';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

class AdminCreateAccountRepository {
  /**
   * Creates admin account (sends to service)
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
   * Creates final admin account after email verification
   */
  async createFinalAdminAccount(adminData) {
    try {
      console.log('Creating final admin account for:', adminData.email);
      
      const functions = getFunctions();
      const createAdminUser = httpsCallable(functions, 'createAdminUser');
      
      const result = await createAdminUser({
        email: adminData.email
      });

      if (result.data.success) {
        return {
          success: true,
          userId: result.data.userId,
          message: result.data.message
        };
      } else {
        throw new Error(result.data.error || 'Failed to create admin account');
      }
      
    } catch (error) {
      console.error('Repository: Error creating final admin account:', error);
      
      if (error.code && error.message) {
        throw new Error(error.message);
      }
      
      throw error;
    }
  }

  /**
   * Checks email verification status
   */
  async checkEmailVerification(email, password) {
    try {
      return await AdminCreateAccountService.checkEmailVerification(email, password);
    } catch (error) {
      console.error('Repository: Error checking email verification:', error);
      throw error;
    }
  }

  /**
   * Resends verification email
   */
  async resendVerificationEmail(email, password) {
    try {
      return await AdminCreateAccountService.resendVerificationEmail(email, password);
    } catch (error) {
      console.error('Repository: Error resending verification email:', error);
      throw error;
    }
  }

  /**
   * Gets pending admin accounts
   */
  async getPendingAdminAccounts() {
    try {
      // Get from both temp_admin_accounts and regular user_accounts with pending status
      const pendingQuery = query(
        collection(db, 'user_accounts'),
        where('role', '==', 'admin'),
        where('status', '==', 'Pending')
      );
      
      const querySnapshot = await getDocs(pendingQuery);
      const regularPending = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));

      // Also get temp admin accounts
      const tempQuery = query(collection(db, 'temp_admin_accounts'));
      const tempSnapshot = await getDocs(tempQuery);
      const tempPending = tempSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        status: 'Email Verification Pending'
      }));

      return [...regularPending, ...tempPending];
    } catch (error) {
      console.error('Repository: Error getting pending admin accounts:', error);
      throw new Error('Failed to fetch pending admin accounts');
    }
  }

  /**
   * Validates form data
   */
  validateAdminForm(formData) {
    return AdminCreateAccountService.validateAdminForm(formData);
  }
}

export default new AdminCreateAccountRepository();