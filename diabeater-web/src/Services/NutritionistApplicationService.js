
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
                status: 'Suspended', 
                username: "",
                createdAt: currentTimestamp 
            };

            
            const userAccountRef = doc(db, "user_accounts", userId);
            batch.set(userAccountRef, userAccountData);

            
            const applicationData = {
                ...data,
                status: 'pending', 
                appliedDate: currentTimestamp, 
                createdAt: currentTimestamp    
            };

            const applicationRef = doc(db, "nutritionist_application", userId);
            batch.set(applicationRef, applicationData);

            
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
            
            
            const applicationRef = doc(db, "nutritionist_application", userId);
            const applicationSnap = await getDoc(applicationRef);

            if (!applicationSnap.exists()) {
                throw new Error("Nutritionist application not found.");
            }

            const applicationData = applicationSnap.data();
            console.log("Application data found:", applicationData);

            
            const batch = writeBatch(db);

            
            const userAccountRef = doc(db, "user_accounts", userId);
            batch.update(userAccountRef, {
                status: 'Active'
            });

            
            batch.update(applicationRef, {
                status: "approved",
                approvedAt: Timestamp.now(),
            });

            
            await batch.commit();
            console.log("Database updates completed successfully");

            
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

            
            batch.update(applicationRef, {
                status: "rejected",
                rejectionReason: reason || "No reason provided", 
                rejectedAt: Timestamp.now(),
            });

            
            const userAccountRef = doc(db, "user_accounts", userId);
            batch.delete(userAccountRef);

            
            await batch.commit();
            console.log("Database updates completed successfully");

            
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