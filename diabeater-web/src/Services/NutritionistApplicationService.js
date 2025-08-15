import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase';
import { db } from "../firebase";
import EmailService from './EmailService'; 

class NutritionistApplicationService {
    async saveNutritionistData(userId, data) {
        try {
            const batch = writeBatch(db);

            const currentTimestamp = Timestamp.now();

            // ❌ REMOVED: Don't create user_accounts document here
            // Only create the application document
            const applicationData = {
                ...data,
                status: 'pending', 
                appliedDate: currentTimestamp, 
                createdAt: currentTimestamp    
            };

            const applicationRef = doc(db, "nutritionist_application", userId);
            batch.set(applicationRef, applicationData);

            await batch.commit();

            console.log("Nutritionist application saved successfully for user:", userId);
        } catch (error) {
            console.error("Error saving nutritionist data:", error);
            throw error;
        }
    }

    async getNutritionistCertificateUrl(userId) {
        try {
            const docRef = doc(db, "nutritionist_application", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return data.certificateUrl || null;
            } else {
                throw new Error("Nutritionist application not found.");
            }
        } catch (error) {
            console.error("NutritionistApplicationService: Error fetching certificate URL:", error);
            throw error;
        }
    }

    async approveNutritionist(userId) {
        try {
            console.log(`Starting approval process for nutritionist: ${userId}`);
            
            // Get application data
            const applicationRef = doc(db, "nutritionist_application", userId);
            const applicationSnap = await getDoc(applicationRef);

            if (!applicationSnap.exists()) {
                throw new Error("Nutritionist application not found.");
            }

            const applicationData = applicationSnap.data();
            console.log("Application data found:", applicationData);

            const batch = writeBatch(db);
            const currentTimestamp = Timestamp.now();

            // ✅ CREATE user_accounts document (instead of updating non-existent one)
            const userAccountData = {
                userId: userId,
                email: applicationData.email,
                firstName: applicationData.firstName,
                lastName: applicationData.lastName,
                dob: applicationData.dob,
                gender: "",
                profilePictureUrl: "",
                role: "nutritionist",
                isPremium: false,
                points: 0,
                level: 1,
                petName: "",
                profileCompleted: true, // Set to true since they completed application
                status: 'Active', // Approved = Active
                username: `${applicationData.firstName.toLowerCase()}${applicationData.lastName.toLowerCase()}`,
                createdAt: currentTimestamp
            };

            const userAccountRef = doc(db, "user_accounts", userId);
            batch.set(userAccountRef, userAccountData); // Use SET instead of UPDATE

            // Update application status
            batch.update(applicationRef, {
                status: "approved",
                approvedAt: currentTimestamp,
                approvedBy: 'admin_user_1' // You can pass actual admin ID later
            });

            await batch.commit();
            console.log("Database updates completed successfully");

            // Send approval email
            try {
                console.log("Attempting to send approval email...");
                const emailResult = await EmailService.sendApprovalEmail(
                    applicationData.email,
                    `${applicationData.firstName} ${applicationData.lastName}`
                );
                
                if (emailResult.success) {
                    console.log("Approval email sent successfully");
                } else {
                    console.error("Approval email failed:", emailResult.message);
                }
            } catch (emailError) {
                console.error("Error sending approval email:", emailError);
                console.warn("Nutritionist approved but email notification failed");
            }

            console.log(`Nutritionist ${userId} approved successfully.`);
            return { 
                success: true, 
                message: "Nutritionist approved successfully",
                emailSent: true 
            };
        } catch (error) {
            console.error("Service: Error approving nutritionist:", error);
            throw error;
        }
    }

    async rejectNutritionist(userId, reason) {
        try {
            console.log(`Starting rejection process for nutritionist: ${userId}`);
            
            const applicationRef = doc(db, "nutritionist_application", userId);
            const applicationSnap = await getDoc(applicationRef);

            if (!applicationSnap.exists()) {
                throw new Error("Nutritionist application not found.");
            }

            const applicationData = applicationSnap.data();
            console.log("Application data found:", applicationData);

            const batch = writeBatch(db);

            // Update application with rejection details
            batch.update(applicationRef, {
                status: "rejected",
                rejectionReason: reason || "No reason provided", 
                rejectedAt: Timestamp.now(),
                rejectedBy: 'admin_user_1' // You can pass actual admin ID later
            });

            // ✅ FIXED: Check if user_accounts document exists before trying to delete
            const userAccountRef = doc(db, "user_accounts", userId);
            const userAccountSnap = await getDoc(userAccountRef);
            
            if (userAccountSnap.exists()) {
                batch.delete(userAccountRef);
                console.log("User account will be deleted");
            } else {
                console.log("No user account found to delete - application was never approved");
            }

            await batch.commit();
            console.log("Database updates completed successfully");

            // Send rejection email
            try {
                console.log("Attempting to send rejection email...");
                const emailResult = await EmailService.sendRejectionEmail(
                    applicationData.email,
                    `${applicationData.firstName} ${applicationData.lastName}`,
                    reason || "No specific reason provided"
                );
                
                if (emailResult.success) {
                    console.log("Rejection email sent successfully");
                } else {
                    console.error("Rejection email failed:", emailResult.message);
                }
            } catch (emailError) {
                console.error("Error sending rejection email:", emailError);
                console.warn("Nutritionist rejected but email notification failed");
            }

            console.log(`Application for ${userId} marked as rejected successfully.`);
            return { 
                success: true, 
                message: "Nutritionist rejected successfully",
                emailSent: true
            };
        } catch (error) {
            console.error("Service: Error rejecting nutritionist:", error);
            throw error;
        }
    }

    // Helper method to check if user account exists
    async userAccountExists(userId) {
        try {
            const userAccountRef = doc(db, "user_accounts", userId);
            const userAccountSnap = await getDoc(userAccountRef);
            return userAccountSnap.exists();
        } catch (error) {
            console.error("Error checking user account existence:", error);
            return false;
        }
    }

    formatDate(timestamp, format = 'short') {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }

        if (format === 'short') {
            return date.toLocaleDateString('en-SG', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } else if (format === 'long') {
            return date.toLocaleDateString('en-SG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        return date.toLocaleDateString('en-SG');
    }
}

export default new NutritionistApplicationService();