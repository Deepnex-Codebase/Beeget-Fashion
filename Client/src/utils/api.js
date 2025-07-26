import axios from 'axios';

// Create a real API instance with axios
const api = axios.create({
  // baseURL: 'https://begget-fashion-backend.onrender.com/api',
  // baseURL: import.meta.env.VITE_BASE_URL,
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Check for tokens in localStorage
    const tokensStr = localStorage.getItem('tokens');
    if (tokensStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        if (tokens && tokens.accessToken) {
          config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
      } catch (error) {
        console.error('Error parsing tokens from localStorage:', error);
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
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Method to set auth token
api.setAuthToken = function(tokens) {
  if (tokens && tokens.accessToken) {
    this.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    localStorage.setItem('tokens', JSON.stringify(tokens));
  } else {
    delete this.defaults.headers.common['Authorization'];
    localStorage.removeItem('tokens');
  }
};


export default api;
