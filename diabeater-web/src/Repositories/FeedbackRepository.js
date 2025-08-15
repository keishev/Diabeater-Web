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

    
    async getFiveStarComplimentFeedbacks() {
        return FeedbackService.getFiveStarComplimentFeedbacks();
    }

    async batchUpdateFeedbacks(updates) {
        return FeedbackService.batchUpdateFeedbacks(updates);
    }

   async automateMarketingFeedbacks() {
    try {
        console.log('[FeedbackRepository] Starting automation...');

        const allFeedbacks = await this.getFeedbacks();
        console.log('[DEBUG] Total feedbacks found:', allFeedbacks.length);
        
        
        allFeedbacks.forEach((feedback, index) => {
            console.log(`[DEBUG] Feedback ${index + 1}:`, {
                id: feedback.id,
                name: feedback.userFirstName,
                rating: feedback.rating,
                category: feedback.category,
                message: feedback.message?.substring(0, 50) + '...'
            });
        });

        
        const complimentVariations = [
            'compliment',
            'Compliment', 
            'COMPLIMENT',
            'Compliments',
            'compliments'
        ];

        console.log('[DEBUG] Checking different category variations...');
        
        complimentVariations.forEach(variation => {
            const matches = allFeedbacks.filter(f => f.rating === 5 && f.category === variation);
            console.log(`[DEBUG] 5-star "${variation}" feedbacks:`, matches.length);
            if (matches.length > 0) {
                console.log(`[DEBUG] Found matches for "${variation}":`, matches.map(m => m.userFirstName));
            }
        });

        
        const allCategories = [...new Set(allFeedbacks.map(f => f.category))];
        console.log('[DEBUG] All unique categories in database:', allCategories);

        
        const fiveStarFeedbacks = allFeedbacks.filter(f => f.rating === 5);
        console.log('[DEBUG] All 5-star feedbacks:', fiveStarFeedbacks.map(f => ({
            name: f.userFirstName,
            category: f.category,
            rating: f.rating
        })));

        
        const automationCandidates = allFeedbacks.filter(feedback => {
            const is5Star = feedback.rating === 5;
            const isCompliment = feedback.category === 'compliment';
            return is5Star && isCompliment;
        });

        console.log(`[DEBUG] Found ${automationCandidates.length} feedbacks with rating=5 AND category="compliment"`);

        if (automationCandidates.length === 0) {
            
            const capitalComplimentCandidates = allFeedbacks.filter(feedback => {
                const is5Star = feedback.rating === 5;
                const isCompliment = feedback.category === 'Compliment';
                return is5Star && isCompliment;
            });
            
            console.log(`[DEBUG] Trying "Compliment" (capital C): found ${capitalComplimentCandidates.length}`);
            
            if (capitalComplimentCandidates.length > 0) {
                console.log('[DEBUG] SUCCESS! Your category is "Compliment" not "compliment"');
                
                const shuffled = capitalComplimentCandidates.sort(() => Math.random() - 0.5);
                const selectedFeedbacks = shuffled.slice(0, 3);
                
                const updates = [];
                
                
                for (const feedback of allFeedbacks) {
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
                        displayOnMarketing: true
                    });
                }
                
                if (updates.length > 0) {
                    await this.batchUpdateFeedbacks(updates);
                }
                
                return {
                    success: true,
                    selectedCount: selectedFeedbacks.length,
                    totalUpdates: updates.length
                };
            }
            
            throw new Error(`No 5-star compliment feedbacks found. Available categories: ${allCategories.join(', ')}. 5-star categories: ${[...new Set(fiveStarFeedbacks.map(f => f.category))].join(', ')}`);
        }

        
        const shuffled = automationCandidates.sort(() => Math.random() - 0.5);
        const selectedFeedbacks = shuffled.slice(0, 3);

        const updates = [];

        for (const feedback of allFeedbacks) {
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
                displayOnMarketing: true
            });
        }

        if (updates.length > 0) {
            await this.batchUpdateFeedbacks(updates);
        }

        return {
            success: true,
            selectedCount: selectedFeedbacks.length,
            totalUpdates: updates.length
        };

    } catch (error) {
        console.error('[FeedbackRepository] Automation error:', error);
        throw error;
    }
}
}

export default new FeedbackRepository();