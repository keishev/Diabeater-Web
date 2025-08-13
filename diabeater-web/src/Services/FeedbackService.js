// src/services/FeedbackService.js
import { collection, getDocs, updateDoc, doc, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";

class FeedbackService {
    constructor() {
        this.feedbackCollectionRef = collection(db, "feedbacks");
    }

    // Method for the Admin Website
    async getFeedbacks() {
        try {
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

    // Method for the Admin Website
    async updateFeedbackStatus(feedbackId, newStatus) {
        try {
            const feedbackDocRef = doc(db, "feedbacks", feedbackId);
            await updateDoc(feedbackDocRef, { status: newStatus });
            console.log(`[FeedbackService] Updated feedback ${feedbackId} status to: ${newStatus}`);
            return true;
        } catch (error) {
            console.error(`Error updating feedback status for ${feedbackId}:`, error);
            throw error;
        }
    }

    // Method for the Admin Website
    async updateDisplayOnMarketing(feedbackId, displayStatus) {
        try {
            const feedbackDocRef = doc(db, "feedbacks", feedbackId);
            await updateDoc(feedbackDocRef, { displayOnMarketing: displayStatus });
            console.log(`[FeedbackService] Updated feedback ${feedbackId} displayOnMarketing to: ${displayStatus}`);
            return true;
        } catch (error) {
            console.error(`Error updating displayOnMarketing for ${feedbackId}:`, error);
            throw error;
        }
    }

    // ENHANCED: Batch update for automation efficiency
    async batchUpdateFeedbacks(updates) {
        try {
            const promises = updates.map(async ({ feedbackId, status, displayOnMarketing }) => {
                const feedbackDocRef = doc(db, "feedbacks", feedbackId);
                const updateData = {};
                
                if (status !== undefined) {
                    updateData.status = status;
                }
                if (displayOnMarketing !== undefined) {
                    updateData.displayOnMarketing = displayOnMarketing;
                }
                
                return updateDoc(feedbackDocRef, updateData);
            });

            await Promise.all(promises);
            console.log(`[FeedbackService] Batch updated ${updates.length} feedbacks`);
            return true;
        } catch (error) {
            console.error("Error in batch update:", error);
            throw error;
        }
    }

    // UPDATED: Method for the Marketing Website - now includes any approved 5-star feedback
    async getPublicFeaturedMarketingFeedbacks() {
        try {
            const q = query(
                this.feedbackCollectionRef,
                where("displayOnMarketing", "==", true),
                where("rating", "==", 5),
                where("status", "==", "Approved"),
                limit(3)
            );
            const querySnapshot = await getDocs(q);
            const result = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`[FeedbackService] Retrieved ${result.length} featured marketing feedbacks`);
            return result;
        } catch (error) {
            console.error("Error fetching public featured marketing feedbacks:", error);
            throw error;
        }
    }

    // ENHANCED: Get all 5-star feedbacks for automation
    async getFiveStarFeedbacks() {
        try {
            const q = query(
                this.feedbackCollectionRef,
                where("rating", "==", 5)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching five-star feedbacks:", error);
            throw error;
        }
    }

    // ENHANCED: Auto-approve and feature feedback for marketing
    async autoApproveAndFeatureFeedback(feedbackId) {
        try {
            const feedbackDocRef = doc(db, "feedbacks", feedbackId);
            await updateDoc(feedbackDocRef, { 
                status: "Approved",
                displayOnMarketing: true
            });
            console.log(`[FeedbackService] Auto-approved and featured feedback ${feedbackId}`);
            return true;
        } catch (error) {
            console.error(`Error auto-approving and featuring feedback ${feedbackId}:`, error);
            throw error;
        }
    }
}

export default new FeedbackService();