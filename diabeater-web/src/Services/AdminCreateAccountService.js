// services/AdminCreateAccountService.js
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

const AdminCreateAccountService = {
  /**
   * Creates a new admin account with email and password
   * @param {Object} adminData - Contains firstName, lastName, email, password, dob
   * @returns {Promise<Object>} - Returns success status and user info
   */
  async createAdminAccount(adminData) {
    try {
      console.log('Creating admin account with data:', { ...adminData, password: '[HIDDEN]' });
      
      const { firstName, lastName, email, password, dob } = adminData;
      
      // Store current user to restore session later
      const currentUser = auth.currentUser;
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      console.log('Firebase Auth user created:', newUser.uid);
      
      // Send email verification
      await sendEmailVerification(newUser);
      console.log('Email verification sent to:', email);
      
      // Create user document in Firestore
      const userData = {
        firstName,
        lastName,
        email,
        dob: new Date(dob),
        role: 'admin',
        status: 'Pending', // Will be changed to Active after email verification and admin setup
        contactNumber: '',
        gender: '',
        isPremium: false,
        points: 0,
        profileCompleted: false,
        profileImageURL: '',
        profilePictureUrl: '',
        createdAt: serverTimestamp(),
        emailVerified: false
      };
      
      await setDoc(doc(db, 'user_accounts', newUser.uid), userData);
      console.log('User document created in Firestore');
      
      // Sign out the newly created user to restore previous session
      await signOut(auth);
      
      // If there was a previous user, they will be restored automatically
      console.log('Signed out new user, previous session restored');
      
      return {
        success: true,
        userId: newUser.uid,
        email: email,
        message: 'Admin account created successfully. Verification email sent.'
      };
      
    } catch (error) {
      console.error('Error creating admin account:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Checks if a user has verified their email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} - Returns verification status and user info
   */
  async checkEmailVerification(email) {
    try {
      console.log('Checking email verification for:', email);
      
      // We need to get the user by email from Firestore since we can't access their auth record directly
      // This is a limitation - we'll need to implement a cloud function for this
      const checkVerificationFunction = httpsCallable(functions, 'checkEmailVerification');
      const result = await checkVerificationFunction({ email });
      
      return result.data;
      
    } catch (error) {
      console.error('Error checking email verification:', error);
      throw new Error(`Failed to check verification status: ${error.message}`);
    }
  },

  /**
   * Sets admin claims for a verified user
   * @param {string} userId - User's UID
   * @returns {Promise<Object>} - Returns success status
   */
  async setAdminClaims(userId) {
    try {
      console.log('Setting admin claims for user:', userId);
      
      const setAdminClaimsFunction = httpsCallable(functions, 'setAdminClaims');
      const result = await setAdminClaimsFunction({ uid: userId });
      
      // Update user status in Firestore
      await setDoc(doc(db, 'user_accounts', userId), {
        status: 'Active',
        emailVerified: true,
        profileCompleted: true
      }, { merge: true });
      
      console.log('Admin claims set and user status updated');
      return result.data;
      
    } catch (error) {
      console.error('Error setting admin claims:', error);
      throw new Error(`Failed to set admin claims: ${error.message}`);
    }
  },
  
  /**
   * Resends verification email to user
   * @param {string} email - Email to send verification to
   * @returns {Promise<Object>} - Result of sending email
   */
  async resendVerificationEmail(email) {
    try {
      console.log('Resending verification email to:', email);

      const resendVerificationFunction = httpsCallable(functions, 'resendVerificationEmail');
      const result = await resendVerificationFunction({ email });

      return result.data;

    } catch (error) {
      console.error('Repository: Error resending verification email:', error);
      throw new Error(`Failed to resend verification email: ${error.message}`);
    }
  },

  /**
   * Validates the admin creation form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} - Validation result
   */
  validateAdminForm(formData) {
    const errors = {};
    
    if (!formData.firstName || formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters long';
    }
    
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long';
    }
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
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