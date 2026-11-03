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
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("lunhaw.auth_user");
      } catch {}
    }
    if (!this.client) {
      await new MockAuthService().logOut();
      return;
    }
    await this.client.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.client) {
      return new MockAuthService().getCurrentUser();
    }

    try {
      const { data } = await this.client.auth.getUser();
      if (!data.user) {
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("lunhaw.auth_user");
            if (raw) return JSON.parse(raw);
          } catch {}
        }
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email ?? "",
        name: data.user.user_metadata?.full_name,
      };
    } catch {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("lunhaw.auth_user");
          if (raw) return JSON.parse(raw);
        } catch {}
      }
      return null;
    }
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

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

declare global {
  interface PromiseConstructor {
    withResolvers<T>(): PromiseWithResolvers<T>;
  }
}

if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

// In-memory Mock Auth implementation for testing / demo
export class MockAuthService implements AuthService {
  private static currentUser: AuthUser | null = null;

  async signUp(name: string, email: string, password?: string): Promise<AuthResponse> {
    // Artificial latency simulation
    await delay(200);

    const user: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
    };
    MockAuthService.currentUser = user;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lunhaw.auth_user", JSON.stringify(user));
      } catch {}
    }
    return { user };
  }

  async logIn(email: string, password?: string): Promise<AuthResponse> {
    await delay(200);

    const user: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name: email.split("@")[0],
    };
    MockAuthService.currentUser = user;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lunhaw.auth_user", JSON.stringify(user));
      } catch {}
    }
    return { user };
  }

  async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    await delay(200);
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    return { success: true };
  }

  async logOut(): Promise<void> {
    MockAuthService.currentUser = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("lunhaw.auth_user");
      } catch {}
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!MockAuthService.currentUser && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("lunhaw.auth_user");
        if (raw) {
          MockAuthService.currentUser = JSON.parse(raw);
        }
      } catch {}
    }
    return MockAuthService.currentUser;
  }
}

// Default auth singleton
export const authService: AuthService = new SupabaseAuthService();
