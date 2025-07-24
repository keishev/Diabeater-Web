// src/repositories/FeedbackRepository.js
import FeedbackService from '../Services/FeedbackService';

class FeedbackRepository {
    async getFeedbacks() {
        return FeedbackService.getAllFeedbacks();
    }

    async approveFeedback(feedbackId) {
        return FeedbackService.updateFeedbackStatus(feedbackId, "Approved");
    }

    async setDisplayOnMarketing(feedbackId, displayStatus) {
        return FeedbackService.updateDisplayOnMarketing(feedbackId, displayStatus);
    }

    async getFeaturedMarketingFeedbacks() {
        return FeedbackService.getMarketingFeedbacks();
    }
}

export default new FeedbackRepository();