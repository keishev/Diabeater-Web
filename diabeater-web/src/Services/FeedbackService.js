// src/services/FeedbackService.js
import { collection, getDocs, updateDoc, doc, query, where, limit } from "firebase/firestore";
import { db } from "../firebase"; // Adjust path as per your firebase-config.js

class FeedbackService {
    constructor() {
        this.feedbackCollectionRef = collection(db, "feedbacks"); // Assuming your collection is named 'feedbacks'
    }

    async getAllFeedbacks() {
        try {
            const querySnapshot = await getDocs(this.feedbackCollectionRef);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
            throw error;
        }
    }

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

    async getMarketingFeedbacks() {
        try {
            const q = query(
                this.feedbackCollectionRef,
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
            console.error("Error fetching marketing feedbacks:", error);
            throw error;
        }
    }
}

export default new FeedbackService();