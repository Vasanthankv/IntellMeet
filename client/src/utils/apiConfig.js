// ─────────────────────────────────────────────────────────────────────────────
// client/src/utils/apiConfig.js
// Centralized, Environment-Aware API and Server Base URL Configuration
// Resolves dynamically between local development and production Render deployment.
// ─────────────────────────────────────────────────────────────────────────────

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://intellmeet-backend-h3md.onrender.com/api';
  }
  return import.meta.env.VITE_API_URL 
    ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
    : 'http://localhost:5000/api';
};

export const getServerBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://intellmeet-backend-h3md.onrender.com';
  }
  return import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
    : 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();
export const SERVER_BASE_URL = getServerBaseUrl();
export const SOCKET_SERVER_URL = SERVER_BASE_URL;

export default {
  API_BASE_URL,
  SERVER_BASE_URL,
  SOCKET_SERVER_URL,
  getApiBaseUrl,
  getServerBaseUrl,
};
