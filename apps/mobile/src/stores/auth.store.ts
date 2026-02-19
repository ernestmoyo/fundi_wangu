import { create } from 'zustand';
import type { UserRole } from '@fundi-wangu/shared-types';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  language: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  otpRequestId: string | null;

  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setOtpRequestId: (id: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  otpRequestId: null,

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setOtpRequestId: (otpRequestId) => set({ otpRequestId }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false, otpRequestId: null }),
}));
