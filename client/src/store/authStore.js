import { create } from 'zustand';

// Sync token keys so legacy and current components share identical tokens
const getInitialToken = () => {
  const token = localStorage.getItem('intellmeet_token') || localStorage.getItem('token') || null;
  if (token) {
    localStorage.setItem('intellmeet_token', token);
    localStorage.setItem('token', token);
  }
  return token;
};

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('intellmeet_user') || localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const initialToken = getInitialToken();
const initialUser = getInitialUser();

export const useAuthStore = create((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  
  login: (user, token) => {
    localStorage.setItem('intellmeet_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('intellmeet_token', token);
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem('intellmeet_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      const merged = { ...state.user, ...updatedFields };
      localStorage.setItem('intellmeet_user', JSON.stringify(merged));
      localStorage.setItem('user', JSON.stringify(merged));
      return { user: merged };
    });
  },
  
  logout: () => {
    localStorage.removeItem('intellmeet_user');
    localStorage.removeItem('user');
    localStorage.removeItem('intellmeet_token');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
