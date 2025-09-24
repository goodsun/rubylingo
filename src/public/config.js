// API Configuration
const API_CONFIG = {
  // Lambda deployment endpoint
  baseUrl: window.location.hostname.includes('amazonaws.com') 
    ? '/v1' // API Gateway stage path (changed from /production to /v1)
    : 'http://localhost:3000' // Local development
};

window.API_BASE_URL = API_CONFIG.baseUrl;