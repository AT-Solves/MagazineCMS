import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'editor' | 'author' | 'reviewer' | 'publisher';
  orgId: string;
  childSafetyClearance: boolean;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      login: async (email: string, password: string) => {
        try {
          set({ loading: true });
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            },
          );

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      verifyToken: async () => {
        try {
          const { token } = get();
          if (!token) {
            set({ loading: false });
            return;
          }

          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/verify`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              isAuthenticated: true,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('Token verification error:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        } finally {
          set({ loading: false });
        }
      },

      setUser: (user: AuthUser) => set({ user, isAuthenticated: true }),
      setToken: (token: string) => set({ token }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
