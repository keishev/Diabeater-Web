import axios from 'axios';

// IMPORTANT: Replace with your actual backend API URL
const API_BASE_URL = 'http://localhost:5000/api';

const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

apiService.interceptors.request.use(
    (config) => {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiService.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            console.error('API Error Response:', error.response.data);
            console.error('Status:', error.response.status);
            if (error.response.status === 401) {
                alert('Session expired or unauthorized. Please log in again.');
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            } else if (error.response.status === 403) {
                alert('You do not have permission to perform this action.');
            } else if (error.response.status >= 500) {
                alert('A server error occurred. Please try again later.');
            } else {
                alert(error.response.data.message || 'An API error occurred.');
            }
        } else if (error.request) {
            alert('No response from server. Please check your network connection.');
        } else {
            alert('An unexpected error occurred. Please try again.');
        }
        return Promise.reject(error);
    }
);

export default apiService;