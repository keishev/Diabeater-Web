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

    const approveFeedback = async (feedbackId) => {
        try {
            await FeedbackRepository.approveFeedback(feedbackId);
            setFeedbacks(prevFeedbacks =>
                prevFeedbacks.map(fb =>
                    fb.id === feedbackId ? { ...fb, status: "Approved" } : fb
                )
            );
            await fetchMarketingFeedbacks();
            return true;
        } catch (err) {
            setError(err);
            return false;
        }
    };

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
            // Step 1: Fetch all feedbacks to find all potential candidates
            const allFeedbacks = await FeedbackRepository.getFeedbacks();

            // Step 2: Get all 5-star feedbacks that are "Approved"
            const approvedFiveStarFeedbacks = allFeedbacks.filter(fb => 
                fb.rating === 5 && fb.status === "Approved"
            );
            
            // Step 3: Deselect any feedbacks that are currently marked for marketing but are not in the new selection
            const newMarketingFeedbackIds = new Set();
            const selectedUserIds = new Set();
            for (const feedback of approvedFiveStarFeedbacks) {
                if (newMarketingFeedbackIds.size >= 3) {
                    break;
                }
                if (!selectedUserIds.has(feedback.userId)) {
                    newMarketingFeedbackIds.add(feedback.id);
                    selectedUserIds.add(feedback.userId);
                }
            }
            
            // Step 4: Go through all feedbacks and update their display status
            for (const feedback of allFeedbacks) {
                const shouldDisplay = newMarketingFeedbackIds.has(feedback.id);
                if (feedback.displayOnMarketing !== shouldDisplay) {
                    await FeedbackRepository.updateDisplayOnMarketing(feedback.id, shouldDisplay);
                }
            }

            // Step 5: Refresh the UI to show the changes
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
        approveFeedback,
        toggleDisplayOnMarketing,
        automateMarketingFeedbacks,
        fetchFeedbacks
    };
};

export default useUserFeedbackViewModel;