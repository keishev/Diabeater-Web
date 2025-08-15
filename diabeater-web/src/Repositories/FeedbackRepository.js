
import FeedbackService from '../Services/FeedbackService';

class FeedbackRepository {
    async getFeedbacks() {
        return FeedbackService.getFeedbacks();
    }

    async updateFeedbackStatus(feedbackId, newStatus) {
        return FeedbackService.updateFeedbackStatus(feedbackId, newStatus);
    }

    async setDisplayOnMarketing(feedbackId, displayStatus) {
        return FeedbackService.updateDisplayOnMarketing(feedbackId, displayStatus);
    }

    async updateDisplayOnMarketing(feedbackId, displayStatus) {
        return FeedbackService.updateDisplayOnMarketing(feedbackId, displayStatus);
    }

    async getFeaturedMarketingFeedbacks() {
        return FeedbackService.getPublicFeaturedMarketingFeedbacks();
    }

    async getFiveStarFeedbacks() {
        return FeedbackService.getFiveStarFeedbacks();
    }

    async batchUpdateFeedbacks(updates) {
        return FeedbackService.batchUpdateFeedbacks(updates);
    }

    
    async automateMarketingFeedbacks() {
        try {
            console.log('[FeedbackRepository] Starting automated marketing feedback selection...');
            
            
            const fiveStarFeedbacks = await this.getFiveStarFeedbacks();
            console.log(`[FeedbackRepository] Found ${fiveStarFeedbacks.length} five-star feedbacks`);

            
            const feedbacksByUser = {};
            fiveStarFeedbacks.forEach(feedback => {
                if (!feedbacksByUser[feedback.userId]) {
                    feedbacksByUser[feedback.userId] = [];
                }
                feedbacksByUser[feedback.userId].push(feedback);
            });

            
            const userIds = Object.keys(feedbacksByUser);
            const shuffledUserIds = userIds.sort(() => Math.random() - 0.5);
            
            const selectedFeedbacks = [];
            
            
            for (let i = 0; i < Math.min(3, shuffledUserIds.length); i++) {
                const userId = shuffledUserIds[i];
                const userFeedbacks = feedbacksByUser[userId];
                
                const randomIndex = Math.floor(Math.random() * userFeedbacks.length);
                const selectedFeedback = userFeedbacks[randomIndex];
                selectedFeedbacks.push(selectedFeedback);
            }

            console.log(`[FeedbackRepository] Selected ${selectedFeedbacks.length} feedbacks for automation from ${selectedFeedbacks.length} different users`);

            
            const updates = [];
            
            
            for (const feedback of fiveStarFeedbacks) {
                if (feedback.displayOnMarketing) {
                    updates.push({
                        feedbackId: feedback.id,
                        displayOnMarketing: false
                    });
                }
            }

            
            for (const feedback of selectedFeedbacks) {
                updates.push({
                    feedbackId: feedback.id,
                    status: "Approved", 
                    displayOnMarketing: true
                });
            }

            
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