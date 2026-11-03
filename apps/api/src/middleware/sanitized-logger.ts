import type { MiddlewareHandler } from 'hono';

/**
 * RA 10173 & Invariant T-003 Privacy-Preserving Logger Middleware
 * Zero-Retention Invariant: Latitude, Longitude, and raw coordinate queries
 * must NEVER be logged to disk, persisted, or leaked into server stdout/telemetry.
 */

export const REDACTED_COORDINATES = '[REDACTED_COORDINATES]';

// Regex patterns to detect and scrub coordinate parameters in query strings and URLs
const COORDINATE_PARAM_REGEX =
  /([?&][^=]*(?:lat|lng|long|lon|coord|point|origin|dest)[^=]*=)([^&#\s]*)/gi;
// Pattern detecting standalone coordinate floating point pairs in query values (e.g. 14.5823,121.0611)
const RAW_COORDINATE_PAIR_REGEX =
  /([?&][^=]+=)(?:-?\d{1,3}(?:\.\d+)?,\s*-?\d{1,3}(?:\.\d+)?)/gi;

/**
 * Sanitizes URLs by replacing all latitude, longitude, and coordinate values
 * with [REDACTED_COORDINATES].
 */
export function sanitizeUrl(url: string): string {
  if (!url) return url;
  return url
    .replace(COORDINATE_PARAM_REGEX, `$1${REDACTED_COORDINATES}`)
    .replace(RAW_COORDINATE_PAIR_REGEX, `$1${REDACTED_COORDINATES}`);
}

/**
 * Coordinate sensitive key detector for JSON payloads
 */
const SENSITIVE_KEYS: Record<string, true> = {
  lat: true,
  lng: true,
  latitude: true,
  longitude: true,
  coords: true,
  coordinates: true,
  origin: true,
  destination: true,
  point: true,
  center: true,
};

/**
 * Recursively sanitizes JSON request payloads to redact sensitive coordinate data
 * before logging or telemetry capture.
 */
export function sanitizePayload(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // If the string contains coordinate-like query patterns, sanitize it
    return sanitizeUrl(data);
  }

  if (Array.isArray(data)) {
    // If it's a coordinate pair array [lng, lat], redact it
    if (
      data.length >= 2 &&
      data.length <= 3 &&
      data.every((item) => typeof item === 'number')
    ) {
      return REDACTED_COORDINATES;
    }
    return data.map((item) => sanitizePayload(item));
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS[lowerKey]) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Object like { lat: 14.5, lng: 121.0 } -> { lat: REDACTED, lng: REDACTED }
          sanitizedObj[key] = sanitizePayload(value);
        } else {
          sanitizedObj[key] = REDACTED_COORDINATES;
        }
      } else {
        sanitizedObj[key] = sanitizePayload(value);
      }
    }
    return sanitizedObj;
  }

  return data;
}

export interface SanitizedLogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  clientPlatform?: string;
}

export type LogWriter = (entry: SanitizedLogEntry, formattedLine: string) => void;

export interface SanitizedLoggerOptions {
  writer?: LogWriter;
}

/**
 * Hono middleware that sanitizes request paths, query strings, and payloads
 * to prevent user geolocation retention per RA 10173 and T-003.
 */
export function sanitizedLogger(options?: SanitizedLoggerOptions): MiddlewareHandler {
  const writeLog: LogWriter =
    options?.writer ||
    ((entry, formattedLine) => {
      // In standard runtime, write formatted sanitized log to stdout
      console.log(formattedLine);
    });

  return async (c, next) => {
    const start = Date.now();
    const rawUrl = c.req.url;
    const sanitizedRequestUrl = sanitizeUrl(rawUrl);
    const method = c.req.method;
    const clientPlatform = c.req.header('x-client-platform');

    await next();

    const durationMs = Date.now() - start;
    const status = c.res.status;
    const timestamp = new Date().toISOString();

    const logEntry: SanitizedLogEntry = {
      timestamp,
      method,
      url: sanitizedRequestUrl,
      status,
      durationMs,
      ...(clientPlatform ? { clientPlatform } : {})
    };

    const formattedLine = `[${timestamp}] ${method} ${sanitizedRequestUrl} ${status} - ${durationMs}ms${
      clientPlatform ? ` [platform=${clientPlatform}]` : ''
    }`;

    writeLog(logEntry, formattedLine);
  };
}
