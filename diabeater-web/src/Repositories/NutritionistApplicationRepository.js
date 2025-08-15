import AuthService from '../Services/NutritionistService';
import StorageService from '../Services/StorageService';
import NutritionistService from '../Services/NutritionistService';
import NutritionistApplicationService from '../Services/NutritionistApplicationService';
import AdminService from '../Services/AdminService';
import Nutritionist from '../Models/Nutritionist';
import { getAuth } from 'firebase/auth';

class NutritionistApplicationRepository {
    constructor(authService, storageService, nutritionistService, adminService, nutritionistApplicationService) {
        this.authService = authService;
        this.storageService = storageService;
        this.nutritionistService = nutritionistService;
        this.adminService = adminService;
        this.nutritionistApplicationService = nutritionistApplicationService;
    }

    async submitNutritionistApplication(userData, certificateFile, userUid = null) {
        try {
            const auth = getAuth();
            let currentUser = auth.currentUser;
            let userId;
            
            console.log('Current user:', currentUser);
            console.log('Provided userUid:', userUid);
            
            if (userUid) {
                
                userId = userUid;
                console.log('Using provided userUid:', userId);
            } else if (currentUser) {
                
                userId = currentUser.uid;
                console.log('Using current user ID:', userId);
                
                
                if (!currentUser.emailVerified) {
                    throw new Error('Email must be verified before submitting application');
                }
            } else {
                
                console.error('Authentication state: No user signed in and no userUid provided');
                throw new Error('User must be authenticated to submit application');
            }

            console.log('Proceeding with userId:', userId);

            
            const certificateUrl = await this.storageService.uploadCertificate(userId, certificateFile);

            
            const applicationData = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                dob: userData.dob,
                certificateUrl: certificateUrl,
                certificateFileName: certificateFile.name,
                status: 'pending',
                emailVerified: true 
            };

            console.log('Saving application data for userId:', userId);

            
            await this.nutritionistApplicationService.saveNutritionistData(userId, applicationData);
            
            return { success: true, message: 'Application submitted successfully' };
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
            return await this.nutritionistApplicationService.approveNutritionist(userId);
        } catch (error) {
            console.error("Repository: Error approving nutritionist:", error);
            throw error;
        }
    }

    async rejectNutritionist(userId, reason) {
        try {
            return await this.nutritionistApplicationService.rejectNutritionist(userId, reason);
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