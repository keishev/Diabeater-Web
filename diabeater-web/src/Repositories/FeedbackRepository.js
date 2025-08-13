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

    // Method to fix the error in ViewModel
    async updateDisplayOnMarketing(feedbackId, displayStatus) {
        return FeedbackService.updateDisplayOnMarketing(feedbackId, displayStatus);
    }

    async getFeaturedMarketingFeedbacks() {
        return FeedbackService.getPublicFeaturedMarketingFeedbacks();
    }

    // ENHANCED: New methods for automation
    async getFiveStarFeedbacks() {
        return FeedbackService.getFiveStarFeedbacks();
    }

    async autoApproveAndFeatureFeedback(feedbackId) {
        return FeedbackService.autoApproveAndFeatureFeedback(feedbackId);
    }

    async batchUpdateFeedbacks(updates) {
        return FeedbackService.batchUpdateFeedbacks(updates);
    }

    // ENHANCED: Helper method for automation workflow
    async automateMarketingFeedbacks() {
        try {
            console.log('[FeedbackRepository] Starting automated marketing feedback selection...');
            
            // Get all 5-star feedbacks
            const fiveStarFeedbacks = await this.getFiveStarFeedbacks();
            console.log(`[FeedbackRepository] Found ${fiveStarFeedbacks.length} five-star feedbacks`);

            // Select up to 3 unique users
            const selectedFeedbacks = [];
            const selectedUserIds = new Set();
            
            for (const feedback of fiveStarFeedbacks) {
                if (selectedFeedbacks.length >= 3) break;
                if (!selectedUserIds.has(feedback.userId)) {
                    selectedFeedbacks.push(feedback);
                    selectedUserIds.add(feedback.userId);
                }
            }

            console.log(`[FeedbackRepository] Selected ${selectedFeedbacks.length} feedbacks for automation`);

            // Create batch updates
            const updates = [];
            
            // First, remove all current marketing features
            for (const feedback of fiveStarFeedbacks) {
                if (feedback.displayOnMarketing) {
                    updates.push({
                        feedbackId: feedback.id,
                        displayOnMarketing: false
                    });
                }
            }

            // Then, approve and feature selected feedbacks
            for (const feedback of selectedFeedbacks) {
                updates.push({
                    feedbackId: feedback.id,
                    status: "Approved",
                    displayOnMarketing: true
                });
            }

            // Execute batch update
            if (updates.length > 0) {
                await this.batchUpdateFeedbacks(updates);
                console.log(`[FeedbackRepository] Completed automation with ${updates.length} updates`);
            }

            return {
                success: true,
                selectedCount: selectedFeedbacks.length,
                totalUpdates: updates.length
            };

        } catch (error) {
            console.error('[FeedbackRepository] Error in automation:', error);
            throw error;
        }
    }
}

export default new FeedbackRepository();