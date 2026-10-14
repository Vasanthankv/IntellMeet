import { API_BASE_URL as ROOT_API_URL } from '../utils/apiConfig';
const API_BASE_URL = `${ROOT_API_URL}/auth`;

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Auth login error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Auth register error:', error);
      throw error;
    }
  },

  socialLogin: async (providerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `${providerData.provider} login failed.`);
      }

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  },

  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.user;
    } catch (error) {
      console.error('Fetch profile error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
};
