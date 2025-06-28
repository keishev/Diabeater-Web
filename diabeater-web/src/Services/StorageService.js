// src/Services/StorageService.js
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class StorageService {
    async uploadCertificate(userId, file) {
        try {
            const storageRef = ref(storage, `certificates/${userId}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading certificate:", error);
            throw error;
        }
    }
}

export default new StorageService();