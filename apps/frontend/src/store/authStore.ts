import { create } from "zustand";
import { useGuildStore } from "./guildStore";

interface IAuthUser {
  id: string;
  email: string;
  username: string;
}

interface IAuthState {
  accessToken: string | null;
  user: IAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hadSession: boolean;

  setAuth: (token: string, user: IAuthUser) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}
const SESSION_HINT_KEY = "discord-clone:had-session";


export const useAuthStore = create<IAuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hadSession: localStorage.getItem(SESSION_HINT_KEY) === "1",

  setAuth: (token, user) => {
    set((state) => {
      if (state.user && state.user.id !== user.id) {
        useGuildStore.getState().resetSessionState();
      }
      return {};
    });
    localStorage.setItem(SESSION_HINT_KEY, "1");
    set({ accessToken: token, user, isAuthenticated: true, isLoading: false, hadSession: true });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    localStorage.removeItem(SESSION_HINT_KEY);
    useGuildStore.getState().resetSessionState();
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hadSession: false,
    });
  },
}));