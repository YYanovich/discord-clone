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

  setAuth: (token: string, user: IAuthUser) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const SESSION_HINT_KEY = "discord:had-session";

export const useAuthStore = create<IAuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (token, user) => {
    set((state) => {
      //reset the store only if a different user signs in. Otherwise the next user
      //could end up seeing cached guilds and messages from the previous session
      if (state.user && state.user.id !== user.id) {
        useGuildStore.getState().resetSessionState();
      }
      return {};
    });

    //keep a small flag in localStorage so we know there was an active session
    //this lets us show a loading state on the next app start while we restore auth
    localStorage.setItem(SESSION_HINT_KEY, "1");

    set({
      accessToken: token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
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
    });
  },
}));
