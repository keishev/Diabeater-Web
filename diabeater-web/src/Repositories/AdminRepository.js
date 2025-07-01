// src/repositories/AdminRepository.js
import AdminService from '../Services/AdminService';

const AdminRepository = {
    async isAdmin() {
        try {
            const result = await AdminService.checkIfCurrentUserIsAdmin();
            return { success: true, isAdmin: result };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};

export default AdminRepository;
