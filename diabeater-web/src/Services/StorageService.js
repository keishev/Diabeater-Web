// src/Services/StorageService.js
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class StorageService {
    async uploadCertificate(userEmail, file) {
        try {
            const encodedEmail = encodeURIComponent(userEmail);
            const encodedFileName = encodeURIComponent(file.name);
            const certificateRef = ref(storage, `certificates/${encodedEmail}/${encodedFileName}`);
            await uploadBytes(certificateRef, file);

            const url = await getDownloadURL(certificateRef);
            return url;
        } catch (error) {
            console.error("Error uploading certificate:", error);
            throw error;
        }
    }
}

export default new StorageService();