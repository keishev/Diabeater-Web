//admin

import FirebaseMarketingContentService from '../Services/FirebaseMarketingContentService';
import MarketingContentModel from '../Models/MarketingContentModel';

class MarketingContentRepository {
    
    constructor(firestoreInstance, authInstance, storageInstance, service) {
        this.service = service || new FirebaseMarketingContentService(firestoreInstance, authInstance, storageInstance);
    }

    async getMarketingContent() {
        return this.service.fetchContent();
    }

    
    subscribeToMarketingContent(callback) {
        return this.service.onContentChange(callback);
    }

    async updateMarketingContentField(key, value) {
        return this.service.updateContentField(key, value);
    }

    async updateAllMarketingContent(contentObject) {
        
        
        const modelInstance = contentObject instanceof MarketingContentModel ? contentObject : new MarketingContentModel(contentObject);
        return this.service.updateAllContent(modelInstance);
    }

    /**
     * Upload APK file to Firebase Storage
     * @param {File} file - The APK file to upload
     * @returns {Promise<string>} - The download URL of the uploaded file
     */
    async uploadAPK(file) {
        return this.service.uploadAPK(file);
    }

    /**
     * Delete APK file from Firebase Storage
     * @param {string} fileName - The name of the file to delete
     */
    async deleteAPK(fileName) {
        return this.service.deleteAPK(fileName);
    }

    async stopMarketingWebsiteHosting() {
        return this.service.stopHosting();
    }
}

export default MarketingContentRepository;