
import { useState, useEffect, useCallback } from 'react';
import FeedbackRepository from '../Repositories/FeedbackRepository';

const useUserFeedbackViewModel = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [marketingFeedbacks, setMarketingFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFeedbacks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await FeedbackRepository.getFeedbacks();
            setFeedbacks(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMarketingFeedbacks = useCallback(async () => {
        try {
            const data = await FeedbackRepository.getFeaturedMarketingFeedbacks();
            setMarketingFeedbacks(data);
        } catch (err) {
            console.error("Error fetching marketing feedbacks:", err);
        }
    }, []);

    useEffect(() => {
        fetchFeedbacks();
        fetchMarketingFeedbacks();
    }, [fetchFeedbacks, fetchMarketingFeedbacks]);

    const toggleDisplayOnMarketing = async (feedbackId, currentDisplayStatus) => {
        try {
            await FeedbackRepository.setDisplayOnMarketing(feedbackId, !currentDisplayStatus);
            setFeedbacks(prevFeedbacks =>
                prevFeedbacks.map(fb =>
                    fb.id === feedbackId ? { ...fb, displayOnMarketing: !currentDisplayStatus } : fb
                )
            );
            await fetchMarketingFeedbacks();
            return true;
        } catch (err) {
            setError(err);
            return false;
        }
    };

    const automateMarketingFeedbacks = async () => {
        try {
            const allFeedbacks = await FeedbackRepository.getFeedbacks();

            
            const fiveStarFeedbacks = allFeedbacks.filter(fb => fb.rating === 5);
            
            
            const feedbacksByUser = {};
            fiveStarFeedbacks.forEach(feedback => {
                if (!feedbacksByUser[feedback.userId]) {
                    feedbacksByUser[feedback.userId] = [];
                }
                feedbacksByUser[feedback.userId].push(feedback);
            });

            
            const userIds = Object.keys(feedbacksByUser);
            const shuffledUserIds = userIds.sort(() => Math.random() - 0.5);
            
            const newMarketingFeedbackIds = new Set();
            
            
            for (let i = 0; i < Math.min(3, shuffledUserIds.length); i++) {
                const userId = shuffledUserIds[i];
                const userFeedbacks = feedbacksByUser[userId];
                
                const randomIndex = Math.floor(Math.random() * userFeedbacks.length);
                const selectedFeedback = userFeedbacks[randomIndex];
                newMarketingFeedbackIds.add(selectedFeedback.id);
            }
            
            
            for (const feedback of allFeedbacks) {
                const shouldDisplay = newMarketingFeedbackIds.has(feedback.id);
                
                
                if (shouldDisplay) {
                    
                    if (!feedback.displayOnMarketing) {
                        await FeedbackRepository.updateDisplayOnMarketing(feedback.id, true);
                    }
                } else {
                    
                    if (feedback.displayOnMarketing) {
                        await FeedbackRepository.updateDisplayOnMarketing(feedback.id, false);
                    }
                }
            }

            await fetchFeedbacks(); 
            await fetchMarketingFeedbacks(); 
            
            return true;
        } catch (err) {
            console.error("Error automating marketing feedbacks:", err);
            setError(err);
            return false;
        }
    };

    return {
        feedbacks,
        marketingFeedbacks,
        loading,
        error,
        toggleDisplayOnMarketing,
        automateMarketingFeedbacks,
        fetchFeedbacks
    };
};

export default useUserFeedbackViewModel;