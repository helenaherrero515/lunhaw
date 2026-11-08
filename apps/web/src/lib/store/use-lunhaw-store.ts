import { create } from "zustand";
import { AuthUser } from "@/lib/auth/auth-service";

interface LunhawState {
  // Auth Dialog state
  isAuthOpen: boolean;
  authMode: "signup" | "login" | "recovery" | "update_password";
  openAuth: (mode?: "signup" | "login" | "recovery" | "update_password") => void;
  closeAuth: () => void;
  setAuthMode: (mode: "signup" | "login" | "recovery" | "update_password") => void;
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;

  // Mobile navigation state
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Green Index interactive slider state
  greenTreeCount: number;
  setGreenTreeCount: (count: number) => void;

  // Reduced motion preference
  prefersReducedMotion: boolean;
  setPrefersReducedMotion: (reduced: boolean) => void;

  // Saved Items Drawer state (C-M3-02 / F-005)
  isSavedDrawerOpen: boolean;
  openSavedDrawer: () => void;
  closeSavedDrawer: () => void;
  toggleSavedDrawer: () => void;
}

export const useLunhawStore = create<LunhawState>((set) => ({
  isAuthOpen: false,
  authMode: "signup",
  openAuth: (mode = "signup") => set({ isAuthOpen: true, authMode: mode }),
  closeAuth: () => set({ isAuthOpen: false }),
  setAuthMode: (mode) => set({ authMode: mode }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  greenTreeCount: 6,
  setGreenTreeCount: (count) => set({ greenTreeCount: count }),

  prefersReducedMotion: false,
  setPrefersReducedMotion: (reduced) => set({ prefersReducedMotion: reduced }),

  isSavedDrawerOpen: false,
  openSavedDrawer: () => set({ isSavedDrawerOpen: true }),
  closeSavedDrawer: () => set({ isSavedDrawerOpen: false }),
  toggleSavedDrawer: () => set((state) => ({ isSavedDrawerOpen: !state.isSavedDrawerOpen })),
}));
