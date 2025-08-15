
import FirebaseMarketingContentService from '../Services/FirebaseMarketingContentService';
import MarketingContentModel from '../Models/MarketingContentModel';

class MarketingContentRepository {
    
    constructor(firestoreInstance, authInstance, service) {
        this.service = service || new FirebaseMarketingContentService(firestoreInstance, authInstance);
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

    async stopMarketingWebsiteHosting() {
        return this.service.stopHosting();
    }
}

export default MarketingContentRepository;