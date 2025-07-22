// src/Repositories/MarketingContentRepository.js
import FirebaseMarketingContentService from '../Services/FirebaseMarketingContentService';
import MarketingContentModel from '../Models/MarketingContentModel'; // Assuming this exists

class MarketingContentRepository {
    // Accept db and auth from the higher layer (ViewModel)
    constructor(firestoreInstance, authInstance, service) { // authInstance is optional if not used by service
        // If a specific service is provided, use it (for testing/mocking).
        // Otherwise, create our Firebase-specific service, passing the Firebase instances.
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
        const modelInstance = contentObject instanceof MarketingContentModel ? contentObject : new MarketingContentModel(contentObject);
        return this.service.updateAllContent(modelInstance);
    }

    async stopMarketingWebsiteHosting() { // <-- Renamed to be more descriptive
        return this.service.stopHosting();
    }
}

export default MarketingContentRepository;