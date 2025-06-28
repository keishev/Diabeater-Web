// src/Repositories/NutritionistRepository.js
import AuthService from '../Services/AuthService';
import StorageService from '../Services/StorageService';
import FirestoreService from '../Services/FirestoreService';
import AdminService from '../Services/AdminService'; // NEW
import Nutritionist from '../Models/Nutritionist';

class NutritionistRepository {
    constructor(authService, storageService, firestoreService, adminService) { // Add adminService
        this.authService = authService;
        this.storageService = storageService;
        this.firestoreService = firestoreService;
        this.adminService = adminService; // Assign
    }

    async createNutritionistAccount(userData, certificateFile) {
        try {
            // 1. Register user with Firebase Authentication
            const user = await this.authService.registerUser(userData.email, userData.password);

            // 2. Upload certificate to Firebase Storage
            const certificateUrl = await this.storageService.uploadCertificate(user.uid, certificateFile);

            // 3. Save nutritionist data to Firestore (status automatically set to 'pending' by Cloud Function)
            const newNutritionist = new Nutritionist(
                user.uid, // Use Firebase Auth UID as the document ID
                userData.firstName,
                userData.lastName,
                userData.email,
                userData.dob,
                certificateUrl,
                'pending' // Explicitly set or let Cloud Function handle
            );
            await this.firestoreService.saveNutritionistData(user.uid, newNutritionist.toFirestore());

            return newNutritionist;

        } catch (error) {
            console.error("Error creating nutritionist account:", error);
            // In a real app, you might want to clean up partially created data (e.g., delete auth user if Firestore fails)
            throw error;
        }
    }

    async getPendingNutritionistsForApproval() {
        try {
            const pending = await this.firestoreService.getPendingNutritionists();
            return pending;
        } catch (error) {
            console.error("Error getting pending nutritionists:", error);
            throw error;
        }
    }

    async approveNutritionist(userId) {
        try {
            const result = await this.adminService.approveNutritionist(userId);
            return result;
        } catch (error) {
            console.error("Repository: Error approving nutritionist:", error);
            throw error;
        }
    }

    async rejectNutritionist(userId, reason) {
        try {
            const result = await this.adminService.rejectNutritionist(userId, reason);
            return result;
        } catch (error) {
            console.error("Repository: Error rejecting nutritionist:", error);
            throw error;
        }
    }

    async getNutritionistCertificateUrl(userId) {
        try {
            const url = await this.adminService.getNutritionistCertificateUrl(userId);
            return url;
        } catch (error) {
            console.error("Repository: Error fetching certificate URL:", error);
            throw error;
        }
    }
}

// Instantiate the repository with its dependencies
const nutritionistRepository = new NutritionistRepository(
    AuthService,
    StorageService,
    FirestoreService,
    AdminService // Pass the new AdminService
);

export default nutritionistRepository;