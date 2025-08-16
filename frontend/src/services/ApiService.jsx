// ApiService.js
// require('dotenv').config();

const API_BASE_URL = 'http://localhost:9999';

export const ApiService = {
  // Auth endpoints
  endpoints: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    verifyAccount: `${API_BASE_URL}/auth/register/verify-account`,
    resendOtp: `${API_BASE_URL}/auth/register/resendOtp`,
    forgetPassword: `${API_BASE_URL}/auth/forget-password`,
    verifyOtp: `${API_BASE_URL}/auth/forget-password/verifyOtp`,
    resetPassword: `${API_BASE_URL}/auth/forget-password/resetPassword`,
  },
  
  // Helper function to make API calls
  async makeRequest(method, url, data = null, includeToken = false) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add authorization token if required
      if (includeToken) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // For OTP verification and password reset, always include the token if available
      if (url.includes('/verifyOtp') || url.includes('/resetPassword')) {
        const tempToken = localStorage.getItem('tempToken');
        if (tempToken) {
          headers['Authorization'] = `Bearer ${tempToken}`;
        }
      }
      
      const options = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }
      
      console.log('API Request:', { url, method, headers, data });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

export default ApiService;
  