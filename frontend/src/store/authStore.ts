import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('dm_user') || 'null'),
  token: localStorage.getItem('dm_token'),
  isAuthenticated: !!localStorage.getItem('dm_token'),
  login: (user, token) => {
    localStorage.setItem('dm_token', token);
    localStorage.setItem('dm_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
