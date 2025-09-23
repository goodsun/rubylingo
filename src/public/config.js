// API Configuration
const API_CONFIG = {
  // Lambda deployment endpoint
  baseUrl: window.location.hostname.includes('amazonaws.com') 
    ? '/production' // API Gateway stage path
    : 'http://localhost:3000' // Local development
};

window.API_BASE_URL = API_CONFIG.baseUrl;