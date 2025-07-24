// src/viewmodels/UserFeedbackViewModel.js
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
            // Handle error for marketing feedbacks if needed
        }
    }, []);

    useEffect(() => {
        fetchFeedbacks();
        fetchMarketingFeedbacks(); // Fetch marketing feedbacks on initial load
    }, [fetchFeedbacks, fetchMarketingFeedbacks]);

    const approveFeedback = async (feedbackId) => {
        try {
            await FeedbackRepository.approveFeedback(feedbackId);
            setFeedbacks(prevFeedbacks =>
                prevFeedbacks.map(fb =>
                    fb.id === feedbackId ? { ...fb, status: "Approved" } : fb
                )
            );
            // After approving, re-fetch marketing feedbacks to see if it qualifies
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
            await fetchMarketingFeedbacks(); // Re-fetch marketing feedbacks after change
            return true;
        } catch (err) {
            setError(err);
            return false;
        }
    };

    // This function will automatically select up to 3 feedbacks with rating 5 for marketing
    const automateMarketingFeedbacks = async () => {
        try {
            // Fetch all 5-star feedbacks
            const fiveStarFeedbacks = await FeedbackRepository.getFeaturedMarketingFeedbacks();

            // Deselect any currently featured feedbacks that are not 5-star or exceed the limit
            const feedbacksToDeselect = feedbacks.filter(fb =>
                fb.displayOnMarketing &&
                (fb.rating !== 5 || !fiveStarFeedbacks.some(f => f.id === fb.id))
            );

            for (const fb of feedbacksToDeselect) {
                await FeedbackRepository.setDisplayOnMarketing(fb.id, false);
            }

            // Select up to 3 five-star feedbacks that are not yet marked for marketing
            const feedbacksToSelect = fiveStarFeedbacks
                .filter(fb => !fb.displayOnMarketing)
                .slice(0, 3 - marketingFeedbacks.length); // Ensure we don't exceed 3 total

            for (const fb of feedbacksToSelect) {
                await FeedbackRepository.setDisplayOnMarketing(fb.id, true);
            }

            await fetchFeedbacks(); // Refresh all feedbacks to reflect changes
            await fetchMarketingFeedbacks(); // Refresh marketing feedbacks
            return true;
        } catch (err) {
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
        fetchFeedbacks // Expose fetchFeedbacks to allow manual refresh if needed
    };
};

export default useUserFeedbackViewModel;