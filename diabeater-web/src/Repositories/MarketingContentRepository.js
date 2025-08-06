// src/Repositories/MarketingContentRepository.js
import FirebaseMarketingContentService from '../Services/FirebaseMarketingContentService';
import MarketingContentModel from '../Models/MarketingContentModel';

class MarketingContentRepository {
    // Accept db and auth from the higher layer (ViewModel)
    constructor(firestoreInstance, authInstance, service) {
        this.service = service || new FirebaseMarketingContentService(firestoreInstance, authInstance);
    }

    async getMarketingContent() {
        return this.service.fetchContent();
    }

    // Renamed for clarity to match the service's `onContentChange`
    subscribeToMarketingContent(callback) {
        return this.service.onContentChange(callback);
    }

    async updateMarketingContentField(key, value) {
        return this.service.updateContentField(key, value);
    }

    async updateAllMarketingContent(contentObject) {
        // Create an instance of the model to ensure all properties, including the new ones,
        // are present before sending to the service. This standardizes the data.
        const modelInstance = contentObject instanceof MarketingContentModel ? contentObject : new MarketingContentModel(contentObject);
        return this.service.updateAllContent(modelInstance);
    }

    async stopMarketingWebsiteHosting() {
        return this.service.stopHosting();
    }
}

export default MarketingContentRepository;