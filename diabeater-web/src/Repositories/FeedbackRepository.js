// src/repositories/FeedbackRepository.js
import FeedbackService from '../Services/FeedbackService';

class FeedbackRepository {
    async getFeedbacks() {
        return FeedbackService.getFeedbacks();
    }

    async updateFeedbackStatus(feedbackId, newStatus) {
        return FeedbackService.updateFeedbackStatus(feedbackId, newStatus);
    }

    async approveFeedback(feedbackId) {
        return this.updateFeedbackStatus(feedbackId, "Approved");
    }

    async setDisplayOnMarketing(feedbackId, displayStatus) {
        return FeedbackService.updateDisplayOnMarketing(feedbackId, displayStatus);
    }

    // Add this new method to fix the error
    async updateDisplayOnMarketing(feedbackId, displayStatus) {
        return FeedbackService.updateDisplayOnMarketing(feedbackId, displayStatus);
    }

    async getFeaturedMarketingFeedbacks() {
        return FeedbackService.getPublicFeaturedMarketingFeedbacks();
    }
}

export default new FeedbackRepository();