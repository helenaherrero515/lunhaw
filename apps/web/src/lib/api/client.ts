/**
 * Lunhaw API client (platform-neutral REST API, apps/api).
 * NEXT_PUBLIC_API_URL is baked in at build time; locally it defaults to `wrangler dev`.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787").replace(/\/+$/, "");

export type VerificationStatus = "VERIFIED" | "ESTIMATE" | "NOT_AVAILABLE";

export interface ApiPlace {
  id: string;
  name: string;
  category: "park" | "garden" | "library" | "reading_center";
  description?: string | null;
  city: string;
  barangay: string;
  address: string;
  coordinates: { lat: number; lng: number };
  verification: {
    status: VerificationStatus;
    official_source_name?: string | null;
    official_source_url?: string | null;
    derivation_note?: string | null;
    last_verified_at?: string | null;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Accept: "application/json", ...init?.headers } });
  } catch {
    throw new ApiError("Couldn't reach Lunhaw. Check your connection and try again.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.detail || "Something went wrong. Please try again.", res.status, body?.code);
  }
  return body as T;
}

/** All published places (the directory is small; the API caps a page at 100). */
export async function fetchPlaces(): Promise<ApiPlace[]> {
  const body = await request<{ data: { places: ApiPlace[] } }>("/v1/places?per_page=100");
  return body.data.places;
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  await request("/v1/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, consent: true }),
  });
}
