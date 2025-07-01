import AuthService from '../Services/NutritionistService';
import StorageService from '../Services/StorageService';
import NutritionistService from '../Services/NutritionistService';
import NutritionistApplicationService from '../Services/NutritionistApplicationService';
import AdminService from '../Services/AdminService';
import Nutritionist from '../Models/Nutritionist';

class NutritionistApplicationRepository {
    constructor(authService, storageService, nutritionistService, adminService, nutritionistApplicationService) {
        this.authService = authService;
        this.storageService = storageService;
        this.nutritionistService = nutritionistService;
        this.adminService = adminService;
        this.nutritionistApplicationService = nutritionistApplicationService;
    }

    async submitNutritionistApplication(userData, certificateFile) {
        try {
            // Upload the certificate and get the URL
            const certificateUrl = await this.storageService.uploadCertificate(userData.email, certificateFile);

            // Include the certificate filename
            const newNutritionist = new Nutritionist(
                null,
                userData.firstName,
                userData.lastName,
                userData.email,
                userData.dob,
                certificateUrl,
                'pending'
            );
            
            const nutritionistData = {
                ...newNutritionist.toFirestore(),
                certificateFileName: certificateFile.name 
            };

            await this.nutritionistApplicationService.saveNutritionistData(userData.email, nutritionistData);
            return newNutritionist;
        } catch (error) {
            console.error("Error submitting nutritionist application:", error);
            throw error;
        }
    }

    async getPendingNutritionistsForApproval() {
        try {
            return await this.nutritionistService.getPendingNutritionists();
        } catch (error) {
            console.error("Error getting pending nutritionists:", error);
            throw error;
        }
    }

    async approveNutritionist(userId) {
        try {
            return await this.adminService.approveNutritionist(userId);
        } catch (error) {
            console.error("Repository: Error approving nutritionist:", error);
            throw error;
        }
    }

    async rejectNutritionist(userId, reason) {
        try {
            return await this.adminService.rejectNutritionist(userId, reason);
        } catch (error) {
            console.error("Repository: Error rejecting nutritionist:", error);
            throw error;
        }
    }

    async getNutritionistCertificateUrl(userId) {
        try {
            return await this.nutritionistApplicationService.getNutritionistCertificateUrl(userId);
        } catch (error) {
            console.error("Repository: Error fetching certificate URL:", error);
            throw error;
        }
    }

    async getAllNutritionists() {
        try {
            return await this.nutritionistService.getAllNutritionists();
        } catch (error) {
            console.error("Repository: Error getting all nutritionists:", error);
            throw error;
        }
    }
}

const nutritionistApplicationRepository = new NutritionistApplicationRepository(
    AuthService,
    StorageService,
    NutritionistService,
    AdminService,
    NutritionistApplicationService
);

export default nutritionistApplicationRepository;
