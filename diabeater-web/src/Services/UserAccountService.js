// services/UserAccountService.js
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const UserAccountService = {
  async fetchAdminProfile(uid) {
    const docRef = doc(db, "user_accounts", uid);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return data.role === 'admin' ? data : null;
    }

    return null;
  },

  async updateAdminProfile(uid, profileData) {
    const docRef = doc(db, "user_accounts", uid);
    await setDoc(docRef, profileData, { merge: true });
  },

  async fetchNutritionistProfile(uid) {
    const docRef = doc(db, "user_accounts", uid);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return data.role === 'nutritionist' ? data : null;
    }

    return null;
  },

  async updateNutritionistProfile(uid, profileData) {
    const docRef = doc(db, "user_accounts", uid);
    await setDoc(docRef, profileData, { merge: true });
  },

  async uploadProfileImage(uid, file) {
    const imageRef = ref(storage, `profileImages/${uid}/${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
  }
};

export default UserAccountService;
