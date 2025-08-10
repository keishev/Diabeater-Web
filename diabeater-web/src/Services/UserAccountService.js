// services/UserAccountService.js - Improved version
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const UserAccountService = {
  async fetchAdminProfile(uid) {
    try {
      console.log('Fetching admin profile for UID:', uid);
      const docRef = doc(db, "user_accounts", uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        console.log('Snapshot exists');
        const data = snapshot.data();
        console.log('User data:', data);
        return data.role === 'admin' ? data : null;
      }

      console.log('No document found for UID:', uid);
      return null;
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      throw error;
    }
  },

  async updateAdminProfile(uid, profileData) {
    try {
      console.log('Updating admin profile for UID:', uid);
      console.log('Profile data:', profileData);
      
      const docRef = doc(db, "user_accounts", uid);
      await setDoc(docRef, profileData, { merge: true });
      
      console.log('Admin profile updated successfully');
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  },

  async fetchNutritionistProfile(uid) {
    try {
      console.log('Fetching nutritionist profile for UID:', uid);
      const docRef = doc(db, "user_accounts", uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('User data:', data);
        return data.role === 'nutritionist' ? data : null;
      }

      console.log('No document found for UID:', uid);
      return null;
    } catch (error) {
      console.error('Error fetching nutritionist profile:', error);
      throw error;
    }
  },

  async updateNutritionistProfile(uid, profileData) {
    try {
      console.log('Updating nutritionist profile for UID:', uid);
      console.log('Profile data:', profileData);
      
      const docRef = doc(db, "user_accounts", uid);
      await setDoc(docRef, profileData, { merge: true });
      
      console.log('Nutritionist profile updated successfully');
    } catch (error) {
      console.error('Error updating nutritionist profile:', error);
      throw error;
    }
  },

  async uploadProfileImage(uid, file) {
    try {
      console.log('=== Profile Image Upload Debug ===');
      console.log('UID:', uid);
      console.log('File:', file);
      console.log('File name:', file?.name);
      console.log('File size:', file?.size);
      console.log('File type:', file?.type);

      // Check authentication
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      console.log('Current user:', currentUser);
      console.log('Current user UID:', currentUser?.uid);
      
      if (!currentUser) {
        throw new Error('User must be authenticated to upload profile image');
      }

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Get user claims to check permissions
      const idTokenResult = await currentUser.getIdTokenResult(true);
      console.log('User claims:', idTokenResult.claims);
      
      // Check permissions: user can upload their own image OR admin can upload any image
      if (currentUser.uid !== uid && !idTokenResult.claims.admin) {
        throw new Error('Permission denied: Cannot upload image for another user');
      }

      // Create unique filename to avoid conflicts
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const uniqueFileName = `profile_${timestamp}_${randomStr}.${fileExtension}`;
      
      const imagePath = `profileImages/${uid}/${uniqueFileName}`;
      console.log('Upload path:', imagePath);

      const imageRef = ref(storage, imagePath);
      console.log('Storage reference created');

      // Upload the file
      console.log('Starting upload...');
      const snapshot = await uploadBytes(imageRef, file);
      console.log('Upload completed:', snapshot);

      // Get download URL
      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadURL);

      return downloadURL;
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more user-friendly error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('Permission denied: Unable to upload image. Please check your permissions.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was canceled');
      } else if (error.code === 'storage/unknown') {
        throw new Error('An unknown error occurred during upload');
      }
      
      throw error;
    }
  }
};

export default UserAccountService;