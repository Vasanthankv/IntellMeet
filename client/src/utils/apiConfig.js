// ─────────────────────────────────────────────────────────────────────────────
// client/src/utils/apiConfig.js
// Centralized, Environment-Aware API and Server Base URL Configuration
// Resolves dynamically between local development and production Render deployment.
// ─────────────────────────────────────────────────────────────────────────────

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://intellmeet-backend-h3md.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

export const getServerBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://intellmeet-backend-h3md.onrender.com';
  }
  return 'http://localhost:5000';
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
