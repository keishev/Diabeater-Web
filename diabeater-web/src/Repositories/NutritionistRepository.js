// src/Repositories/NutritionistRepository.js
import AuthService from '../Services/NutritionistService';
import StorageService from '../Services/StorageService';
import FirestoreService from '../Services/FirestoreService';
import AdminService from '../Services/AdminService'; // Ensure this is imported
import Nutritionist from '../Models/Nutritionist'; // Ensure this is imported

class NutritionistRepository {
    constructor(authService, storageService, firestoreService, adminService) {
        this.authService = authService;
        this.storageService = storageService;
        this.firestoreService = firestoreService;
        this.adminService = adminService;
    }

    async createNutritionistAccount(userData, certificateFile) {
        try {
            const user = await this.authService.registerUser(userData.email, userData.password);
            const certificateUrl = await this.storageService.uploadCertificate(user.uid, certificateFile);
            const newNutritionist = new Nutritionist(
                user.uid,
                userData.firstName,
                userData.lastName,
                userData.email,
                userData.dob,
                certificateUrl,
                'pending'
            );
            await this.firestoreService.saveNutritionistData(user.uid, newNutritionist.toFirestore());
            return newNutritionist;
        } catch (error) {
            console.error("Error creating nutritionist account:", error);
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

    // Now correctly fetches the URL via AdminService
    async getNutritionistCertificateUrl(userId) {
        try {
            const url = await this.adminService.getNutritionistCertificateUrl(userId);
            return url;
        } catch (error) {
            console.error("Repository: Error fetching certificate URL from AdminService:", error);
            throw error;
        }
    }

    async getAllNutritionists() {
        try {
            return await this.firestoreService.getAllNutritionists();
        } catch (error) {
            console.error("Repository: Error getting all nutritionists:", error);
            throw error;
        }
    }
}

const nutritionistRepository = new NutritionistRepository(
    AuthService,
    StorageService,
    FirestoreService,
    AdminService
);

export default nutritionistRepository;