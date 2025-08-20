/**
 * API Service for handling all API requests
 */
const API_BASE_URL = 'http://localhost:9999/auth';  // Verify this matches your backend port

const ApiService = {
  // API endpoints
  endpoints: {
    login: '/login',
    register: '/register',
    forgetPassword: '/forget-password',
    verifyOtp: '/forget-password/verifyOtp',
    resetPassword: '/forget-password/resetPassword',
    verifyAccount: '/register/verify-account',
    resendOtp: '/register/resendOtp',
  },

  /**
   * Make an API request
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} customOptions - Additional request options
   * @returns {Promise<Object>} - Response data
   */
  makeRequest: async (method, endpoint, body = null, customOptions = {}) => {
    try {
      console.log(`API ${method} request to ${endpoint}:`, body);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Request failed');
      }

      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
};

export default ApiService;