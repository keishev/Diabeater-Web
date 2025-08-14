// services/AdminCreateAccountService.js - PURE CLIENT-SIDE VERSION
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AdminCreateAccountService = {
  /**
   * Creates admin account entirely on client-side using Firebase Auth
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
      
      console.log('Creating admin account entirely on client-side...');

      const auth = getAuth();
      const db = getFirestore();
      
      // Step 1: Create Firebase Auth user
      console.log('Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      console.log('Firebase Auth user created:', user.uid);
      
     
      // Step 3: Create Firestore document
      const adminData_firestore = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        dob: new Date(dob),
        role: 'admin',
        status: 'Pending Email Verification',
        emailVerified: false,
        uid: user.uid,
        contactNumber: '',
        gender: '',
        isPremium: false,
        points: 0,
        profileCompleted: false,
        profileImageURL: '',
        profilePictureUrl: '',
        createdAt: serverTimestamp()
      };
      console.log('Firestore document data prepared:', adminData_firestore);

      await setDoc(doc(db, 'user_accounts', user.uid), adminData_firestore);
      console.log('Admin user document created in Firestore');
      
      // Step 4: Send Firebase verification email
      await sendEmailVerification(user);
      console.log('Firebase verification email sent');
      
      
      return {
        success: true,
        email: email.trim(),
        uid: user.uid,
        message: 'Admin account created and Firebase verification email sent. Please check your email.'
      };

    } catch (error) {
      console.error('Error creating admin account:', error);
      
      // Handle specific Firebase/Cloud Function errors
      if (error.code) {
        switch (error.code) {
          case 'functions/already-exists':
            throw new Error('This email is already in use. Please use a different email address.');
          case 'functions/invalid-argument':
            throw new Error('Invalid data provided. Please check all fields.');
          case 'functions/permission-denied':
            throw new Error('You do not have permission to create admin accounts.');
          case 'functions/unauthenticated':
            throw new Error('You must be logged in to create admin accounts.');
          case 'functions/unavailable':
            throw new Error('Service temporarily unavailable. Please try again in a moment.');
          case 'functions/deadline-exceeded':
            throw new Error('Request timed out. Please try again.');
          default:
            throw new Error(error.message || 'Failed to create admin account');
        }
      }
      
      throw new Error(error.message || 'Failed to create admin account');
    }
  },

  /**
   * Checks email verification status using Firebase Auth
   */
  async checkEmailVerification(email) {
    try {
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      
      console.log('Checking email verification status...');
      
      // Use cloud function to check verification and set admin claims
      const functions = getFunctions();
      const checkEmailVerification = httpsCallable(functions, 'checkEmailVerification');
      
      const result = await checkEmailVerification({ 
        email: email.trim() 
      });

      console.log('Check verification result:', result.data);
      
      return result.data;

    } catch (error) {
      console.error('Error checking email verification:', error);

      if (error.code) {
        switch (error.code) {
          case 'functions/not-found':
            throw new Error('No account found with this email address');
          case 'functions/invalid-argument':
            throw new Error('Invalid email address provided');
          case 'functions/permission-denied':
            throw new Error('Permission denied');
          default:
            throw new Error(error.message || 'Failed to check verification status');
        }
      }

      throw new Error(error.message || 'Failed to check verification status');
    }
  },

  /**
   * Resends Firebase verification email (client-side)
   */
  async resendVerificationEmail(email, password) {
    try {
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      
      if (!password) {
        throw new Error('Password is required to resend verification email');
      }

      console.log('Resending Firebase verification email...');

      const auth = getAuth();
      
      // Sign in to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      if (user.emailVerified) {
        await signOut(auth);
        throw new Error('Email is already verified');
      }
      
      // Send Firebase's built-in verification email
      await sendEmailVerification(user);
      
      // Sign out the user
      await signOut(auth);
      
      console.log('Firebase verification email resent successfully');
      
      return {
        success: true,
        message: 'Verification email resent successfully. Please check your email.'
      };

    } catch (error) {
      console.error('Error resending verification email:', error);
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            throw new Error('No account found with this email address');
          case 'auth/wrong-password':
            throw new Error('Incorrect password provided');
          case 'auth/invalid-email':
            throw new Error('Invalid email address provided');
          case 'auth/too-many-requests':
            throw new Error('Too many attempts. Please wait a moment and try again.');
          case 'auth/user-disabled':
            throw new Error('This account has been disabled');
          default:
            throw new Error(error.message || 'Failed to resend verification email');
        }
      }
      
      throw new Error(error.message || 'Failed to resend verification email');
    }
  },

  /**
   * Form validation (unchanged)
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