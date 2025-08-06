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
            return true;
        } catch (error) {
            console.error(`Error updating displayOnMarketing for ${feedbackId}:`, error);
            throw error;
        }
    }

    // Method for the Marketing Website
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
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching public featured marketing feedbacks:", error);
            throw error;
        }
    }
}
export default new FeedbackService();