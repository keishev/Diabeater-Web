// src/viewmodels/AuthViewModel.js
import { useState } from 'react';
import AuthRepository from '../Repositories/AuthRepository';

const useAuthViewModel = (onLoginSuccess) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const login = async () => {
      setError('');
      setIsLoading(true);

      const result = await AuthRepository.login(email, password, role);
      if (result.success) {
          onLoginSuccess(result.data.role);
      } else {
          setError(result.error);
          setIsLoading(false);
      }
    };

    const logout = async () => {
      setError('');
      setIsLoading(true);
      const result = await AuthRepository.logout();
      setIsLoading(false);

      if (!result.success) {
        setError(result.error || 'Logout failed');
      } else {
        window.location.href = '/login';
      }
    };

    return {
      email,
      setEmail,
      password,
      setPassword,
      role,
      setRole,
      error,
      isLoading,
      showPassword,
      setShowPassword,
      login,
      logout
    };
};

export default useAuthViewModel;
