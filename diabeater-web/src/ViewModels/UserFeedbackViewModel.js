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

    // ENHANCED: Automate marketing feedbacks with auto-approval
    const automateMarketingFeedbacks = async () => {
        try {
            console.log('[UserFeedbackViewModel] Starting automated marketing feedbacks...');
            
            const allFeedbacks = await FeedbackRepository.getFeedbacks();

            // UPDATED: Select 5-star feedbacks regardless of approval status
            const fiveStarFeedbacks = allFeedbacks.filter(fb => fb.rating === 5);
            
            console.log(`[UserFeedbackViewModel] Found ${fiveStarFeedbacks.length} five-star feedbacks`);
            
            // Select up to 3 unique users with 5-star feedbacks
            const selectedFeedbacks = [];
            const selectedUserIds = new Set();
            
            for (const feedback of fiveStarFeedbacks) {
                if (selectedFeedbacks.length >= 3) {
                    break;
                }
                if (!selectedUserIds.has(feedback.userId)) {
                    selectedFeedbacks.push(feedback);
                    selectedUserIds.add(feedback.userId);
                }
            }

            console.log(`[UserFeedbackViewModel] Selected ${selectedFeedbacks.length} feedbacks for marketing`);

            // First, remove all existing marketing feedbacks
            for (const feedback of allFeedbacks) {
                if (feedback.displayOnMarketing) {
                    await FeedbackRepository.updateDisplayOnMarketing(feedback.id, false);
                    console.log(`[UserFeedbackViewModel] Removed feedback ${feedback.id} from marketing`);
                }
            }

            // ENHANCED: Auto-approve and set to display on marketing for selected feedbacks
            for (const feedback of selectedFeedbacks) {
                // Auto-approve the feedback if not already approved
                if (feedback.status !== "Approved") {
                    await FeedbackRepository.updateFeedbackStatus(feedback.id, "Approved");
                    console.log(`[UserFeedbackViewModel] Auto-approved feedback ${feedback.id}`);
                }
                
                // Set to display on marketing
                await FeedbackRepository.updateDisplayOnMarketing(feedback.id, true);
                console.log(`[UserFeedbackViewModel] Featured feedback ${feedback.id} on marketing`);
            }

            // Refresh both feedbacks and marketing feedbacks
            await fetchFeedbacks(); 
            await fetchMarketingFeedbacks(); 
            
            console.log('[UserFeedbackViewModel] Automated marketing feedbacks completed successfully');
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