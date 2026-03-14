import { create } from "zustand";
import type { AuthState } from "@/domain/types";
import { getAuthState, clearAuth } from "@/lib/store";
import { startOAuthFlow, exchangeCodeForTokens } from "@/services/auth.service";

type AuthStore = {
  auth: AuthState;
  loading: boolean;
  init: () => Promise<void>;
  login: () => Promise<void>;
  handleOAuthCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  auth: { isAuthenticated: false },
  loading: true,

  init: async () => {
    const state = await getAuthState();
    set({ auth: state, loading: false });
  },

  login: async () => {
    set({ loading: true });
    try {
      await startOAuthFlow();
    } finally {
      set({ loading: false });
    }
  },

  handleOAuthCode: async (code: string) => {
    set({ loading: true });
    try {
      const state = await exchangeCodeForTokens(code);
      set({ auth: state, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  logout: async () => {
    await clearAuth();
    set({ auth: { isAuthenticated: false } });
  },
}));
