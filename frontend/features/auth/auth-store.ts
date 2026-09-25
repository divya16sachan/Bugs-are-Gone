import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "./schemas";
import { setAccessToken, getAccessToken, apiClient } from "@/lib/api-client";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  fetchSession: () => Promise<AuthUser | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      setAuth: (user: AuthUser, token: string) => {
        setAccessToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      },

      setUser: (user: AuthUser | null) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          isInitialized: true,
        });
      },

      clearAuth: () => {
        setAccessToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      fetchSession: async () => {
        const token = getAccessToken() || get().token;
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
          return null;
        }

        try {
          set({ isLoading: true });
          const user = await apiClient.get<AuthUser>("/api/v1/auth/check");
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          return user;
        } catch (err: any) {
          if (err?.status === 401 || err?.statusCode === 401) {
            get().clearAuth();
          } else {
            set({ isLoading: false, isInitialized: true });
          }
          return null;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.token) {
            setAccessToken(state.token);
          }
          state.fetchSession().catch(() => {});
        }
      },
    }
  )
);

// Listen to storage and auth:change events for cross-tab and global synchronization
if (typeof window !== "undefined") {
  window.addEventListener("auth:change", (e: any) => {
    const newToken = e.detail?.token;
    const currentToken = useAuthStore.getState().token;
    if (newToken !== currentToken) {
      if (!newToken) {
        useAuthStore.getState().clearAuth();
      } else {
        useAuthStore.getState().fetchSession().catch(() => {});
      }
    }
  });

  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === "accessToken" || e.key === "auth-storage") {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        useAuthStore.getState().clearAuth();
      } else {
        useAuthStore.getState().fetchSession().catch(() => {});
      }
    }
  });
}
