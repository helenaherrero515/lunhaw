import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error?: string;
}

export interface AuthService {
  signUp(name: string, email: string, pass: string): Promise<AuthResponse>;
  logIn(email: string, pass: string): Promise<AuthResponse>;
  logOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }>;
}

// Browser Supabase client instantiation with fallback for local demo
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

// Production Supabase Auth implementation
export class SupabaseAuthService implements AuthService {
  private client: SupabaseClient | null;

  constructor() {
    this.client = getSupabaseClient();
  }

  async signUp(name: string, email: string, password: string): Promise<AuthResponse> {
    if (!this.client) {
      // Fallback to stub mode if environment variables are not yet configured
      return new MockAuthService().signUp(name, email, password);
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? email,
            name: data.user.user_metadata?.full_name ?? name,
          }
        : null,
    };
  }

  async logIn(email: string, password: string): Promise<AuthResponse> {
    if (!this.client) {
      return new MockAuthService().logIn(email, password);
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? email,
            name: data.user.user_metadata?.full_name,
          }
        : null,
    };
  }

  async logOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.client) {
      return new MockAuthService().getCurrentUser();
    }

    const { data } = await this.client.auth.getUser();
    if (!data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email ?? "",
      name: data.user.user_metadata?.full_name,
    };
  }

  async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return new MockAuthService().signInWithMagicLink(email);
    }

    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}

// In-memory Mock Auth implementation for testing / demo
export class MockAuthService implements AuthService {
  private static currentUser: AuthUser | null = null;

  async signUp(name: string, email: string, password?: string): Promise<AuthResponse> {
    // Artificial latency simulation
    await new Promise((r) => setTimeout(r, 200));

    const user: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
    };
    MockAuthService.currentUser = user;
    return { user };
  }

  async logIn(email: string, password?: string): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 200));

    const user: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name: email.split("@")[0],
    };
    MockAuthService.currentUser = user;
    return { user };
  }

  async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    await new Promise((r) => setTimeout(r, 200));
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    return { success: true };
  }

  async logOut(): Promise<void> {
    MockAuthService.currentUser = null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return MockAuthService.currentUser;
  }
}

// Default auth singleton
export const authService: AuthService = new SupabaseAuthService();
