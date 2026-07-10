import { create } from "zustand";

export type CurrentUser = {
  id: string;
  condominio_id: string;
  email: string;
  nombre: string;
  rol: "admin" | "contador" | "conserje" | "residente";
  is_active: boolean;
};

type AuthState = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
};

/** Solo estado de UI (quién es el usuario actual, para pintar nombre/rol).
 * Los tokens nunca viven aquí — son cookies httpOnly que Next maneja server-side. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
