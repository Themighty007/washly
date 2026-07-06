// Client-side auth store using Zustand
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/lib/types";

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
    { name: "theidrott-auth" }
  )
);

// Fetch helper that auto-attaches Bearer token
export function authFetch(url: string, init: RequestInit = {}) {
  const token = useAuth.getState().token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers });
}

// Build export URL with token (for window.open)
export function exportUrl(type: string, format: "csv" | "json" = "csv"): string {
  const token = useAuth.getState().token || "";
  return `/api/export?type=${type}&format=${format}&token=${encodeURIComponent(token)}`;
}
