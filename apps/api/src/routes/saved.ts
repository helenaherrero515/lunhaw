import { Hono } from 'hono';
import type { Env, ProblemDetails } from '../types/index.js';

export const savedRoute = new Hono<{ Bindings: Env }>();

interface SavedItem {
  id: string;
  client_session_id: string;
  item_type: 'place' | 'route';
  place_id?: string;
  route_id?: string;
  notes?: string;
  created_at: string;
}

// In-memory mock store for pseudonymous session bookmarks
const savedItemsStore: SavedItem[] = [];

// GET /saved
savedRoute.get('/', (c) => {
  const sessionId = c.req.header('x-session-id') || c.req.query('session_id');
  const itemType = c.req.query('item_type');

  if (!sessionId) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'X-Session-ID header or session_id query parameter is required to access saved items.',
      instance: c.req.path,
      code: 'ERR_MISSING_SESSION'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  let items = savedItemsStore.filter((item) => item.client_session_id === sessionId);
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
  const sessionId = c.req.header('x-session-id');
  let body: {
    client_session_id?: string;
    item_type: 'place' | 'route';
    place_id?: string;
    route_id?: string;
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

  const effectiveSessionId = sessionId || body.client_session_id;

  if (!effectiveSessionId) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_MISSING_SESSION',
      title: 'Missing Client Session',
      status: 400,
      detail: 'X-Session-ID header or client_session_id body field is required.',
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

  const newItem: SavedItem = {
    id: crypto.randomUUID(),
    client_session_id: effectiveSessionId,
    item_type: body.item_type,
    ...(body.place_id ? { place_id: body.place_id } : {}),
    ...(body.route_id ? { route_id: body.route_id } : {}),
    ...(body.notes ? { notes: body.notes } : {}),
    created_at: new Date().toISOString()
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
  const id = c.req.param('id');
  const index = savedItemsStore.findIndex((item) => item.id === id);

  if (index !== -1) {
    savedItemsStore.splice(index, 1);
  }

  return c.body(null, 204);
});
