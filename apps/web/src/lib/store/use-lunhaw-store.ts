import { create } from "zustand";

interface LunhawState {
  // Auth Dialog state
  isAuthOpen: boolean;
  authMode: "signup" | "login";
  openAuth: (mode?: "signup" | "login") => void;
  closeAuth: () => void;
  setAuthMode: (mode: "signup" | "login") => void;

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
