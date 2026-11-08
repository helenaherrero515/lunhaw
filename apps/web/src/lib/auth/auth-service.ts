import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error?: string;
  /** Sign-up succeeded but the account must be confirmed from the email link before logging in. */
  needsEmailConfirmation?: boolean;
}

export interface AuthService {
  signUp(name: string, email: string, pass: string): Promise<AuthResponse>;
  logIn(email: string, pass: string): Promise<AuthResponse>;
  logOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }>;
}

export const ACCOUNTS_UNAVAILABLE = "Accounts aren’t available right now. Please try again later.";

/**
 * The in-memory mock accepts any email and password, so it must never run for real visitors.
 * It is only used when Supabase isn't configured AND we're in development/tests (or explicitly allowed).
 */
export function isMockAuthAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === "true";
}

let supabaseClient: SupabaseClient | null | undefined;

// One browser Supabase client per page (it owns the session in storage).
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient !== undefined) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  supabaseClient = url && anonKey ? createClient(url, anonKey) : null;
  return supabaseClient;
}

const toUser = (u: { id: string; email?: string | null; user_metadata?: { full_name?: string } }, fallbackEmail = "", fallbackName?: string): AuthUser => ({
  id: u.id,
  email: u.email ?? fallbackEmail,
  name: u.user_metadata?.full_name ?? fallbackName,
});

// Production Supabase Auth implementation
export class SupabaseAuthService implements AuthService {
  private get client(): SupabaseClient | null {
    return getSupabaseClient();
  }

  /** Mock in dev/tests only; in production without Supabase, accounts are simply unavailable. */
  private get fallback(): MockAuthService | null {
    return isMockAuthAllowed() ? new MockAuthService() : null;
  }

  async signUp(name: string, email: string, password: string): Promise<AuthResponse> {
    const client = this.client;
    if (!client) return this.fallback ? this.fallback.signUp(name, email, password) : { user: null, error: ACCOUNTS_UNAVAILABLE };

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/home` : undefined,
      },
    });
    if (error) return { user: null, error: error.message };

    return {
      user: data.user ? toUser(data.user, email, name) : null,
      // With email confirmation on (Supabase default) there is no session until the link is opened.
      needsEmailConfirmation: !data.session,
    };
  }

  async logIn(email: string, password: string): Promise<AuthResponse> {
    const client = this.client;
    if (!client) return this.fallback ? this.fallback.logIn(email, password) : { user: null, error: ACCOUNTS_UNAVAILABLE };

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user ? toUser(data.user, email) : null };
  }

  async logOut(): Promise<void> {
    const client = this.client;
    if (!client) {
      await new MockAuthService().logOut();
      return;
    }
    await client.auth.signOut();
  }

  /** Only the Supabase session counts. No local copy of the user is trusted. */
  async getCurrentUser(): Promise<AuthUser | null> {
    const client = this.client;
    if (!client) return this.fallback ? this.fallback.getCurrentUser() : null;
    try {
      const { data } = await client.auth.getUser();
      return data.user ? toUser(data.user) : null;
    } catch {
      return null;
    }
  }

  async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    const client = this.client;
    if (!client) {
      return this.fallback ? this.fallback.signInWithMagicLink(email) : { success: false, error: ACCOUNTS_UNAVAILABLE };
    }
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/home` : undefined },
    });
    if (error) return { success: false, error: error.message };
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
