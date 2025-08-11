// src/Services/NutritionistApplicationService.js
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase';
import { db } from "../firebase";
import EmailService from './EmailService'; // Import EmailService

class NutritionistApplicationService {
    async saveNutritionistData(userId, data) {
        try {
            // Use a batch write to ensure both documents are created atomically
            const batch = writeBatch(db);

            // Create current timestamp for both documents
            const currentTimestamp = Timestamp.now();

            // First, create user account data (this must exist for permission checks)
            const userAccountData = {
                userId: userId,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                dob: data.dob,
                gender: "",
                profilePictureUrl: "",
                role: "nutritionist",
                isPremium: false,
                points: 0,
                profileCompleted: false,
                status: 'Suspended', // Suspended until approved
                username: "",
                createdAt: currentTimestamp // Use Firestore Timestamp
            };

            // Add user account to batch
            const userAccountRef = doc(db, "user_accounts", userId);
            batch.set(userAccountRef, userAccountData);

            // Then, save to nutritionist_application collection
            const applicationData = {
                ...data,
                status: 'pending', // For application tracking
                appliedDate: currentTimestamp, // Use Firestore Timestamp for application date
                createdAt: currentTimestamp    // Also keep createdAt for consistency
            };

            const applicationRef = doc(db, "nutritionist_application", userId);
            batch.set(applicationRef, applicationData);

            // Execute the batch
            await batch.commit();

            console.log("Nutritionist data saved successfully for user:", userId);
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
            
            // Get the application document
            const applicationRef = doc(db, "nutritionist_application", userId);
            const applicationSnap = await getDoc(applicationRef);

            if (!applicationSnap.exists()) {
                throw new Error("Nutritionist application not found.");
            }

            const applicationData = applicationSnap.data();
            console.log("Application data found:", applicationData);

            // Use batch to ensure atomic updates
            const batch = writeBatch(db);

            // Update the user account status to Active
            const userAccountRef = doc(db, "user_accounts", userId);
            batch.update(userAccountRef, {
                status: 'Active'
            });

            // Update application status
            batch.update(applicationRef, {
                status: "approved",
                approvedAt: Timestamp.now(),
            });

            // Execute the batch
            await batch.commit();
            console.log("Database updates completed successfully");

            // Send approval email
            try {
                await EmailService.sendApprovalEmail(
                    applicationData.email,
                    `${applicationData.firstName} ${applicationData.lastName}`
                );
                console.log("Approval email sent successfully");
            } catch (emailError) {
                console.error("Error sending approval email:", emailError);
                // Don't throw here - the approval was successful even if email failed
                console.warn("Nutritionist approved but email notification failed");
            }

            console.log(`Nutritionist ${userId} approved successfully.`);
            return { 
                success: true, 
                message: "Nutritionist approved successfully",
                emailSent: true // You could track this if needed
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

            // Use batch to update application and delete user account atomically
            const batch = writeBatch(db);

            // Update application status
            batch.update(applicationRef, {
                status: "rejected",
                rejectionReason: reason || "No reason provided", 
                rejectedAt: Timestamp.now(),
            });

            // Delete the user account since application is rejected
            const userAccountRef = doc(db, "user_accounts", userId);
            batch.delete(userAccountRef);

            // Execute the batch
            await batch.commit();
            console.log("Database updates completed successfully");

            // Send rejection email
            try {
                await EmailService.sendRejectionEmail(
                    applicationData.email,
                    `${applicationData.firstName} ${applicationData.lastName}`,
                    reason || "No specific reason provided"
                );
                console.log("Rejection email sent successfully");
            } catch (emailError) {
                console.error("Error sending rejection email:", emailError);
                // Don't throw here - the rejection was successful even if email failed
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

    // Helper method to format dates consistently
    formatDate(timestamp, format = 'short') {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp.toDate) {
            // Firestore Timestamp
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