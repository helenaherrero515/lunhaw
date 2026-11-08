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

/** A published Green Index (EQ-005). Always an Estimate; see apps/api/src/data/green-index-source.ts. */
export interface GreenIndex {
  status: "ESTIMATE";
  method: string;
  question: string;
  score: number;
  band: "Low" | "Moderate" | "High";
  range: [number, number];
  borderline: boolean;
  unit: { type: "park_polygon" | "library_300m"; source: string; area_ha: number | null };
  components: { key: string; label: string; value_pct: number; target_pct: number | null; weight: number; sub_score: number }[];
  vegetation_vigour_ndvi: number | null;
  green_access_300m: boolean | null;
  imagery: { canopy: string | null; vegetation: string | null };
  checked: { on: string | null; points: number | null };
  sources: string[];
  caveats: string[];
}

/** The place's published Green Index, or null when it hasn't been checked and published yet. */
export async function fetchGreenIndex(placeId: string): Promise<GreenIndex | null> {
  const body = await request<{ data: (GreenIndex & { status: string }) | { status: "NOT_AVAILABLE" } }>(
    `/v1/places/${encodeURIComponent(placeId)}/green-index`
  );
  return body.data.status === "ESTIMATE" ? (body.data as GreenIndex) : null;
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  await request("/v1/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, consent: true }),
  });
}
