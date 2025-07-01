// src/Services/StorageService.js
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class StorageService {
    async uploadCertificate(userId, file) {
        try {
            const certificateRef = ref(storage, `certificates/${userId}/${file.name}`);
            const url = await getDownloadURL(certificateRef);
            return url;
        } catch (error) {
            console.error("Error uploading certificate:", error);
            throw error;
        }
    }
}

export default new StorageService();