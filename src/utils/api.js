import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production environment
  if (process.env.NODE_ENV === 'production') {
    return 'https://spmbackend.onrender.com';
  }
  // Default to localhost for development
  return 'http://localhost:5000';
};

// Create and configure axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Function to set authentication token
export const setAuthToken = (token) => {
  if (token) {
    // Set token for all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Remove token from headers
    delete api.defaults.headers.common['Authorization'];
  }
};

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for enhanced error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.config.url);
      
      // Only show toast in production for 404s
      if (process.env.NODE_ENV === 'production') {
        toast.error('The requested resource was not found');
      }
      
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      setAuthToken(null);
      window.location.href = '/login';
    }
    
    if (error.response?.status === 500) {
      console.error('Server error:', error.response?.data);
      toast.error('Server error. Please try again later.');
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR') {
      console.error('Network error:', error.message);
      toast.error('Network connection failed. Please check your internet.');
    }
    
    // Default error handling
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error('API Error:', errorMessage);
    
    // Only show toast for non-404 errors in production
    if (process.env.NODE_ENV === 'production' && error.response?.status !== 404) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default api;
