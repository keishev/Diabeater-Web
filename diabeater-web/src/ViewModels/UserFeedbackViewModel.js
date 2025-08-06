// src/ViewModels/UserFeedbackViewModel.js
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

    const retrackFeedback = async (feedbackId) => {
        try {
            // Updated status to 'Inbox'
            await FeedbackRepository.updateFeedbackStatus(feedbackId, "Inbox");
            await FeedbackRepository.updateDisplayOnMarketing(feedbackId, false);
            setFeedbacks(prevFeedbacks => 
                // Updated status to 'Inbox'
                prevFeedbacks.map(fb => 
                    fb.id === feedbackId ? { ...fb, status: "Inbox", displayOnMarketing: false } : fb
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
            const allFeedbacks = await FeedbackRepository.getFeedbacks();

            const approvedFiveStarFeedbacks = allFeedbacks.filter(fb => 
                fb.rating === 5 && fb.status === "Approved"
            );
            
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
            
            for (const feedback of allFeedbacks) {
                const shouldDisplay = newMarketingFeedbackIds.has(feedback.id);
                if (feedback.displayOnMarketing !== shouldDisplay) {
                    await FeedbackRepository.updateDisplayOnMarketing(feedback.id, shouldDisplay);
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
        approveFeedback,
        retrackFeedback,
        toggleDisplayOnMarketing,
        automateMarketingFeedbacks,
        fetchFeedbacks
    };
};

export default useUserFeedbackViewModel;