import { Hono } from 'hono';
import type { Env, ProblemDetails } from '../types/index.js';
import { resolveAuth } from '../utils/auth.js';

export const savedRoute = new Hono<{ Bindings: Env }>();

export interface SavedItem {
  id: string;
  user_id?: string | null;
  client_session_id: string;
  item_type: 'place' | 'route';
  place_id?: string | null;
  route_id?: string | null;
  route_data?: Record<string, unknown> | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// In-memory mock store for pseudonymous session bookmarks and authenticated user items
const savedItemsStore: SavedItem[] = [];

/**
 * Reset store for isolated unit testing
 */
export function resetSavedItemsStore(): void {
  savedItemsStore.length = 0;
}

/**
 * Access store copy for testing inspection
 */
export function getSavedItemsStore(): readonly SavedItem[] {
  return [...savedItemsStore];
}

/**
 * Strips raw GPS coordinate traces from route payloads to enforce
 * Invariant T-003 and Republic Act No. 10173 (Data Privacy Act of 2012).
 */
export function sanitizeRouteData(
  data?: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    // Exclude raw coordinate fields (T-003, RA 10173)
    if (
      lowerKey.includes('lat') ||
      lowerKey.includes('lng') ||
      lowerKey.includes('lon') ||
      lowerKey.includes('coord') ||
      lowerKey.includes('point') ||
      lowerKey.includes('geom') ||
      lowerKey.includes('gps') ||
      lowerKey.includes('trace')
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      // Drop numeric coordinate tuples like [lng, lat]
      if (
        value.length >= 2 &&
        value.length <= 4 &&
        value.every((v) => typeof v === 'number')
      ) {
        continue;
      }
      sanitized[key] = value
        .filter((item) => !(Array.isArray(item) && item.every((v) => typeof v === 'number')))
        .map((item) =>
          item && typeof item === 'object' && !Array.isArray(item)
            ? sanitizeRouteData(item as Record<string, unknown>)
            : item
        );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeRouteData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Helper to match item ownership for the current caller
 */
function isItemOwnedByCaller(
  item: SavedItem,
  userId: string | null | undefined,
  sessionId: string | null | undefined
): boolean {
  if (userId && item.user_id === userId) {
    return true;
  }
  if (sessionId && item.client_session_id === sessionId) {
    return true;
  }
  return false;
}

// ==========================================
// 1. Generic /saved Endpoints
// ==========================================

// GET /saved
savedRoute.get('/', (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;
  const itemType = c.req.query('item_type');

  if (!user && !sessionId) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'Authorization Bearer token or X-Session-ID header is required to access saved items.',
      instance: c.req.path,
      code: 'ERR_MISSING_SESSION'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  let items = savedItemsStore.filter((item) => {
    if (user) {
      return item.user_id === user.id;
    }
    return item.client_session_id === sessionId;
  });

  if (itemType) {
    items = items.filter((item) => item.item_type === itemType);
  }

  return c.json({
    status: 'success',
    data: {
      items
    }
  });
});

// POST /saved
savedRoute.post('/', async (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;

  let body: {
    client_session_id?: string;
    item_type?: 'place' | 'route';
    place_id?: string;
    route_id?: string;
    route_data?: Record<string, unknown>;
    notes?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MALFORMED_JSON',
      title: 'Malformed JSON Payload',
      status: 400,
      detail: 'The request body could not be parsed as valid JSON.',
      instance: c.req.path,
      code: 'ERR_MALFORMED_JSON'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const effectiveSessionId =
    sessionId || body.client_session_id || (user ? `user:${user.id}` : undefined);

  if (!effectiveSessionId && !user) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'Authorization Bearer token or X-Session-ID header is required.',
      instance: c.req.path,
      code: 'ERR_MISSING_SESSION'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  if (!body.item_type || (body.item_type !== 'place' && body.item_type !== 'route')) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_INVALID_ITEM_TYPE',
      title: 'Invalid Item Type',
      status: 400,
      detail: "item_type must be either 'place' or 'route'.",
      instance: c.req.path,
      code: 'ERR_INVALID_ITEM_TYPE'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const nowIso = new Date().toISOString();
  const newItem: SavedItem = {
    id: crypto.randomUUID(),
    user_id: user ? user.id : null,
    client_session_id: effectiveSessionId || `user:${user!.id}`,
    item_type: body.item_type,
    place_id: body.place_id || null,
    route_id: body.route_id || null,
    route_data: sanitizeRouteData(body.route_data),
    notes: body.notes || null,
    created_at: nowIso,
    updated_at: nowIso
  };

  savedItemsStore.push(newItem);

  return c.json(
    {
      status: 'success',
      data: newItem
    },
    201
  );
});

// DELETE /saved/:id
savedRoute.delete('/:id', (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;
  const id = c.req.param('id');
  const index = savedItemsStore.findIndex((item) => item.id === id);

  if (index === -1) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_ITEM_NOT_FOUND',
      title: 'Saved Item Not Found',
      status: 404,
      detail: `No saved item found with id ${id}.`,
      instance: c.req.path,
      code: 'ERR_ITEM_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  const item = savedItemsStore[index];
  // Verify ownership
  if (!item || !isItemOwnedByCaller(item, user?.id, sessionId)) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_ITEM_NOT_FOUND',
      title: 'Saved Item Not Found',
      status: 404,
      detail: `No saved item found with id ${id}.`,
      instance: c.req.path,
      code: 'ERR_ITEM_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  savedItemsStore.splice(index, 1);
  return c.body(null, 204);
});

// ==========================================
// 2. Dedicated /saved/places Endpoints (A-M3-01)
// ==========================================

// GET /saved/places
savedRoute.get('/places', (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;

  if (!user && !sessionId) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'Authorization Bearer token or X-Session-ID header is required.',
      instance: c.req.path,
      code: 'ERR_MISSING_SESSION'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const items = savedItemsStore.filter((item) => {
    if (item.item_type !== 'place') return false;
    if (user) return item.user_id === user.id;
    return item.client_session_id === sessionId;
  });

  return c.json({
    status: 'success',
    data: {
      items
    }
  });
});

// POST /saved/places
savedRoute.post('/places', async (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;

  let body: {
    place_id?: string;
    notes?: string;
    client_session_id?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MALFORMED_JSON',
      title: 'Malformed JSON Payload',
      status: 400,
      detail: 'The request body could not be parsed as valid JSON.',
      instance: c.req.path,
      code: 'ERR_MALFORMED_JSON'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const effectiveSessionId =
    sessionId || body.client_session_id || (user ? `user:${user.id}` : undefined);

  if (!effectiveSessionId && !user) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'Authorization Bearer token or X-Session-ID header is required.',
      instance: c.req.path,
      code: 'ERR_MISSING_SESSION'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  if (!body.place_id || typeof body.place_id !== 'string') {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_PLACE_ID',
      title: 'Missing Place Identifier',
      status: 400,
      detail: 'place_id is required to bookmark a place.',
      instance: c.req.path,
      code: 'ERR_MISSING_PLACE_ID'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const nowIso = new Date().toISOString();
  const newItem: SavedItem = {
    id: crypto.randomUUID(),
    user_id: user ? user.id : null,
    client_session_id: effectiveSessionId || `user:${user!.id}`,
    item_type: 'place',
    place_id: body.place_id,
    route_id: null,
    route_data: null,
    notes: body.notes || null,
    created_at: nowIso,
    updated_at: nowIso
  };

  savedItemsStore.push(newItem);

  return c.json(
    {
      status: 'success',
      data: newItem
    },
    201
  );
});

// DELETE /saved/places/:id
savedRoute.delete('/places/:id', (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;
  const id = c.req.param('id');
  const index = savedItemsStore.findIndex(
    (item) => item.id === id && item.item_type === 'place'
  );

  if (index === -1) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_ITEM_NOT_FOUND',
      title: 'Saved Place Not Found',
      status: 404,
      detail: `No saved place found with id ${id}.`,
      instance: c.req.path,
      code: 'ERR_ITEM_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  const item = savedItemsStore[index];
  if (!item || !isItemOwnedByCaller(item, user?.id, sessionId)) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_ITEM_NOT_FOUND',
      title: 'Saved Place Not Found',
      status: 404,
      detail: `No saved place found with id ${id}.`,
      instance: c.req.path,
      code: 'ERR_ITEM_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  savedItemsStore.splice(index, 1);
  return c.body(null, 204);
});

// ==========================================
// 3. Dedicated /saved/routes Endpoints (A-M3-01)
// ==========================================

// GET /saved/routes
savedRoute.get('/routes', (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;

  if (!user && !sessionId) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'Authorization Bearer token or X-Session-ID header is required.',
      instance: c.req.path,
      code: 'ERR_MISSING_SESSION'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const items = savedItemsStore.filter((item) => {
    if (item.item_type !== 'route') return false;
    if (user) return item.user_id === user.id;
    return item.client_session_id === sessionId;
  });

  return c.json({
    status: 'success',
    data: {
      items
    }
  });
});

// POST /saved/routes
savedRoute.post('/routes', async (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;

  let body: {
    route_id?: string;
    route_data?: Record<string, unknown>;
    notes?: string;
    client_session_id?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MALFORMED_JSON',
      title: 'Malformed JSON Payload',
      status: 400,
      detail: 'The request body could not be parsed as valid JSON.',
      instance: c.req.path,
      code: 'ERR_MALFORMED_JSON'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const effectiveSessionId =
    sessionId || body.client_session_id || (user ? `user:${user.id}` : undefined);

  if (!effectiveSessionId && !user) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'Authorization Bearer token or X-Session-ID header is required.',
      instance: c.req.path,
      code: 'ERR_MISSING_SESSION'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  if (!body.route_id && !body.route_data) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_ROUTE_REFERENCE',
      title: 'Missing Route Reference',
      status: 400,
      detail: 'Either route_id or route_data must be provided to save a route.',
      instance: c.req.path,
      code: 'ERR_MISSING_ROUTE_REFERENCE'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  const nowIso = new Date().toISOString();
  const newItem: SavedItem = {
    id: crypto.randomUUID(),
    user_id: user ? user.id : null,
    client_session_id: effectiveSessionId || `user:${user!.id}`,
    item_type: 'route',
    place_id: null,
    route_id: body.route_id || null,
    // Zero GPS coordinate retention (T-003, RA 10173)
    route_data: sanitizeRouteData(body.route_data),
    notes: body.notes || null,
    created_at: nowIso,
    updated_at: nowIso
  };

  savedItemsStore.push(newItem);

  return c.json(
    {
      status: 'success',
      data: newItem
    },
    201
  );
});

// DELETE /saved/routes/:id
savedRoute.delete('/routes/:id', (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;
  const id = c.req.param('id');
  const index = savedItemsStore.findIndex(
    (item) => item.id === id && item.item_type === 'route'
  );

  if (index === -1) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_ITEM_NOT_FOUND',
      title: 'Saved Route Not Found',
      status: 404,
      detail: `No saved route found with id ${id}.`,
      instance: c.req.path,
      code: 'ERR_ITEM_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  const item = savedItemsStore[index];
  if (!item || !isItemOwnedByCaller(item, user?.id, sessionId)) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_ITEM_NOT_FOUND',
      title: 'Saved Route Not Found',
      status: 404,
      detail: `No saved route found with id ${id}.`,
      instance: c.req.path,
      code: 'ERR_ITEM_NOT_FOUND'
    };
    return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
  }

  savedItemsStore.splice(index, 1);
  return c.body(null, 204);
});

// ==========================================
// 4. Cross-Device Sync Endpoints (/saved/sync)
// ==========================================

// GET /saved/sync
savedRoute.get('/sync', (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;

  if (!user && !sessionId) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_UNAUTHORIZED',
      title: 'Unauthorized',
      status: 401,
      detail: 'Authentication or session identifier is required for sync.',
      instance: c.req.path,
      code: 'ERR_UNAUTHORIZED'
    };
    return c.json(problem, 401, { 'Content-Type': 'application/problem+json' });
  }

  const items = savedItemsStore.filter((item) => {
    if (user) return item.user_id === user.id;
    return item.client_session_id === sessionId;
  });

  return c.json({
    status: 'success',
    data: {
      synced_count: items.length,
      items
    }
  });
});

// POST /saved/sync
savedRoute.post('/sync', async (c) => {
  const auth = resolveAuth(c);
  if (auth.error) {
    return c.json(auth.error, 401, { 'Content-Type': 'application/problem+json' });
  }

  const { user, sessionId } = auth;

  if (!user && !sessionId) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_UNAUTHORIZED',
      title: 'Unauthorized',
      status: 401,
      detail: 'Authentication or session identifier is required to sync saved bookmarks.',
      instance: c.req.path,
      code: 'ERR_UNAUTHORIZED'
    };
    return c.json(problem, 401, { 'Content-Type': 'application/problem+json' });
  }

  let body: {
    session_id?: string;
    items?: Array<{
      item_type: 'place' | 'route';
      place_id?: string;
      route_id?: string;
      route_data?: Record<string, unknown>;
      notes?: string;
    }>;
  } = {};

  try {
    body = await c.req.json();
  } catch {
    // Empty body is acceptable for session migration
  }

  let migratedCount = 0;

  // 1. If authenticated and session_id is provided, migrate anonymous bookmarks to user profile
  const sourceSessionId = body.session_id || sessionId;
  if (user && sourceSessionId) {
    for (const item of savedItemsStore) {
      if (item.client_session_id === sourceSessionId && !item.user_id) {
        item.user_id = user.id;
        item.updated_at = new Date().toISOString();
        migratedCount++;
      }
    }
  }

  // 2. Merge any client-supplied items
  if (Array.isArray(body.items)) {
    const nowIso = new Date().toISOString();
    for (const raw of body.items) {
      if (!raw.item_type || (raw.item_type !== 'place' && raw.item_type !== 'route')) {
        continue;
      }

      // Check if duplicate already exists for user/session
      const duplicate = savedItemsStore.some((existing) => {
        const belongs = user
          ? existing.user_id === user.id
          : existing.client_session_id === sourceSessionId;
        if (!belongs) return false;
        if (raw.item_type === 'place') {
          return existing.item_type === 'place' && existing.place_id === raw.place_id;
        }
        return existing.item_type === 'route' && existing.route_id === raw.route_id;
      });

      if (!duplicate) {
        const newItem: SavedItem = {
          id: crypto.randomUUID(),
          user_id: user ? user.id : null,
          client_session_id: sourceSessionId || (user ? `user:${user.id}` : 'sess_anon'),
          item_type: raw.item_type,
          place_id: raw.place_id || null,
          route_id: raw.route_id || null,
          route_data: sanitizeRouteData(raw.route_data),
          notes: raw.notes || null,
          created_at: nowIso,
          updated_at: nowIso
        };
        savedItemsStore.push(newItem);
        migratedCount++;
      }
    }
  }

  // Return all items belonging to this user or session
  const currentItems = savedItemsStore.filter((item) => {
    if (user) return item.user_id === user.id;
    return item.client_session_id === sourceSessionId;
  });

  return c.json({
    status: 'success',
    data: {
      synced_count: currentItems.length,
      migrated_count: migratedCount,
      items: currentItems
    }
  });
});
