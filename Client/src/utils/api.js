import axios from 'axios';
import Cookies from 'js-cookie';

// Create a real API instance with axios
const api = axios.create({
  // baseURL: 'https://begget-fashion-backend.onrender.com/api',
  baseURL: import.meta.env.VITE_BASE_URL,
  // baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Check for tokens in cookies
    const tokensStr = Cookies.get('tokens');
    if (tokensStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        if (tokens && tokens.accessToken) {
          config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
      } catch (error) {
        // Error parsing tokens from cookies
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Method to set auth token
api.setAuthToken = function(tokens) {
  if (tokens && tokens.accessToken) {
    this.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    // Set cookie with secure options
    Cookies.set('tokens', JSON.stringify(tokens), { 
      expires: 7, // expires in 7 days
      secure: window.location.protocol === 'https:', // secure in production
      sameSite: 'strict' // CSRF protection
    });
  } else {
    delete this.defaults.headers.common['Authorization'];
    Cookies.remove('tokens');
  }
};

export default api;
