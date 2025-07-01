// src/repositories/AuthRepository.js
import AuthService from '../Services/AuthService';

const AuthRepository = {
    async login(email, password, selectedRole) {
        try {
            const result = await AuthService.loginWithEmail(email, password, selectedRole);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

  async logout() {
    try {
      await AuthService.logout();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default AuthRepository;
