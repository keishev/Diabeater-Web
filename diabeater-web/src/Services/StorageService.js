// src/Services/StorageService.js
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class StorageService {
    async uploadCertificate(userId, file) {
        try {
            const encodedFileName = encodeURIComponent(file.name);
            const certificateRef = ref(storage, `certificates/${userId}/${encodedFileName}`);
            
            console.log('Upload path:', `certificates/${userId}/${encodedFileName}`);
            console.log('Uploading file:', file.name);
            
            await uploadBytes(certificateRef, file);
            const url = await getDownloadURL(certificateRef);
            
            console.log('Upload successful, URL:', url);
            return url;
        } catch (error) {
            console.error("Error uploading certificate:", error);
            throw error;
        }
    }
}

export default new StorageService();