// src/services/FeedbackService.js (for your marketing website project)
import { collection, getDocs, updateDoc, doc, query, where, limit } from "firebase/firestore";
import { db } from "../firebase"; // Adjust path as per your firebase-config.js

class FeedbackService {
    constructor() {
        // This collection will contain the *curated* 5-star, clean feedbacks
        this.feedbackCollectionRef = collection(db, "feedbacks");
        // Ensure your main app submits to 'user_feedbacks' for the Cloud Function to process.
    }

    async getAllFeedbacks() {
        try {
            // This method would typically be used by an admin panel to see ALL feedbacks (raw and processed)
            // For a public marketing site, it's generally not needed.
            const querySnapshot = await getDocs(this.feedbackCollectionRef);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching all feedbacks:", error);
            throw error;
        }
    }

    // These update methods would typically be used by an admin panel
    // to manually override or manage feedback status/display status if needed.
    async updateFeedbackStatus(feedbackId, newStatus) {
        try {
            const feedbackDocRef = doc(db, "feedbacks", feedbackId);
            await updateDoc(feedbackDocRef, { status: newStatus });
            return true;
        } catch (error) {
            console.error(`Error updating feedback status for ${feedbackId}:`, error);
            throw error;
        }
    }

    async updateDisplayOnMarketing(feedbackId, displayStatus) {
        try {
            const feedbackDocRef = doc(db, "feedbacks", feedbackId);
            await updateDoc(feedbackDocRef, { displayOnMarketing: displayStatus });
            return true;
        } catch (error) {
            console.error(`Error updating displayOnMarketing for ${feedbackId}:`, error);
            throw error;
        }
    }

    /**
     * Fetches up to 3 feedbacks that are marked for marketing display
     * by the Cloud Function (5-star and clean).
     * This query now relies on the Cloud Function to set 'displayOnMarketing' and 'status'.
     * @returns {Array} An array of feedback objects.
     */
    async getMarketingFeedbacks() {
        try {
            const q = query(
                this.feedbackCollectionRef,
                where("rating", "==", 5),
                where("status", "==", "Approved"),        // Expected status after Cloud Function processing
                where("displayOnMarketing", "==", true),  // Expected status after Cloud Function processing
                limit(3)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching marketing feedbacks:", error);
            throw error;
        }
    }
}

export default new FeedbackService();