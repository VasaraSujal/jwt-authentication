/**
 * API Service for handling all API requests
 */
const API_BASE_URL = 'http://localhost:9999/auth';

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
      // Set default headers
      const headers = {
        'Content-Type': 'application/json',
        ...customOptions.headers,
      };

      // Add authorization header if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Prepare request options
      const options = {
        method,
        headers,
        credentials: 'include', // Include cookies in the request
        ...customOptions,
      };

      // Add body if provided
      if (body) {
        options.body = JSON.stringify(body);
      }

      // Make the request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      // Parse the response
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
};

export default ApiService;