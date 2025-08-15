import { collection, getDocs, updateDoc, doc, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";

class FeedbackService {
    constructor() {
        this.feedbackCollectionRef = collection(db, "feedbacks");
    }

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

    async batchUpdateFeedbacks(updates) {
        try {
            const promises = updates.map(async ({ feedbackId, displayOnMarketing }) => {
                const feedbackDocRef = doc(db, "feedbacks", feedbackId);
                const updateData = {};

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

    async getPublicFeaturedMarketingFeedbacks() {
        try {
            const q = query(
                this.feedbackCollectionRef,
                where("displayOnMarketing", "==", true),
                where("rating", "==", 5),
                where("category", "==", "compliment"), 
                limit(3)
            );
            const querySnapshot = await getDocs(q);
            const result = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`[FeedbackService] Retrieved ${result.length} featured marketing feedbacks (5-star compliments)`);
            return result;
        } catch (error) {
            console.error("Error fetching public featured marketing feedbacks:", error);
            throw error;
        }
    }

   
   async getPublicFeaturedMarketingFeedbacks() {
    try {
        const q = query(
            this.feedbackCollectionRef,
            where("displayOnMarketing", "==", true),
            where("rating", "==", 5),
            limit(3)
        );
        const querySnapshot = await getDocs(q);
        const result = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`[Admin FeedbackService] Retrieved ${result.length} featured marketing feedbacks`);
        return result;
    } catch (error) {
        console.error("Error fetching public featured marketing feedbacks:", error);
        throw error;
    }
}


async getFiveStarComplimentFeedbacks() {
    try {
        const q = query(
            this.feedbackCollectionRef,
            where("rating", "==", 5),
            where("category", "==", "compliment")
            
        );
        const querySnapshot = await getDocs(q);
        const result = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`[Admin FeedbackService] Retrieved ${result.length} five-star compliment feedbacks`);
        return result;
    } catch (error) {
        console.error("Error fetching five-star compliment feedbacks:", error);
        throw error;
    }
}
}
export default new FeedbackService();