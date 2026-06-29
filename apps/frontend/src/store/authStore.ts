import { create } from "zustand";

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

export const useAuthStore = create<IAuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
