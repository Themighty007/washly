import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_BASE = import.meta.env.VITE_API_URL || "http://192.168.29.243:3000";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "CUSTOMER" | "CLEANER" | "ADMIN";
  avatar?: string | null;
  address?: string | null;
}

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  login: (user: SessionUser, token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "washly-auth" }
  )
);

export function authFetch(url: string, init: RequestInit = {}) {
  const token = useAuth.getState().token;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${'${token}'}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const fullUrl = url.startsWith("http") ? url : `${'${API_BASE}'}${'${url}'}`;
  return fetch(fullUrl, { ...init, headers });
}