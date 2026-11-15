import { describe, it, expect, beforeEach } from 'vitest';
import { testApp as app } from './helpers.js';
import { resetSavedItemsStore, type SavedItem } from '../src/routes/saved.js';
import { createTestJwt } from './helpers.js';

describe('Saved Places & Commute Routes Sync (A-M3-01, F-005, INV-003)', () => {
  beforeEach(() => {
    resetSavedItemsStore();
  });

  describe('Pseudonymous Session Places CRUD (/saved/places)', () => {
    it('creates a saved place for an anonymous session', async () => {
      const sessionId = 'anon-session-abc-123';
      const placeId = 'f0010000-0000-0000-0000-000000000020';

      const res = await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          place_id: placeId,
          notes: 'Great study area on 2nd floor'
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json<{ status: string; data: SavedItem }>();
      expect(json.status).toBe('success');
      expect(json.data.place_id).toBe(placeId);
      expect(json.data.client_session_id).toBe(sessionId);
      expect(json.data.item_type).toBe('place');
      expect(json.data.notes).toBe('Great study area on 2nd floor');
      expect(json.data.id).toBeDefined();
    });

    it('retrieves saved places filtered by session ID', async () => {
      const sessionId = 'anon-session-abc-123';
      const placeId = 'f0010000-0000-0000-0000-000000000020';

      // 1. Create a place bookmark
      await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ place_id: placeId })
      });

      // 2. Fetch saved places
      const res = await app.request('/saved/places', {
        headers: { 'X-Session-ID': sessionId }
      });

      expect(res.status).toBe(200);
      const json = await res.json<{ status: string; data: { items: SavedItem[] } }>();
      expect(json.data.items.length).toBe(1);
      expect(json.data.items[0]!.place_id).toBe(placeId);
      expect(json.data.items[0]!.item_type).toBe('place');
    });

    it('deletes a saved place bookmark and returns 204', async () => {
      const sessionId = 'anon-session-abc-123';
      const placeId = 'f0010000-0000-0000-0000-000000000020';

      const createRes = await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ place_id: placeId })
      });
      const created = await createRes.json<{ data: SavedItem }>();

      // Delete the created bookmark
      const deleteRes = await app.request(`/saved/places/${created.data.id}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionId }
      });
      expect(deleteRes.status).toBe(204);

      // Verify item is removed
      const fetchRes = await app.request('/saved/places', {
        headers: { 'X-Session-ID': sessionId }
      });
      const fetchJson = await fetchRes.json<{ data: { items: SavedItem[] } }>();
      expect(fetchJson.data.items.length).toBe(0);
    });

    it('returns 400 when place_id is missing', async () => {
      const res = await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': 'session-test'
        },
        body: JSON.stringify({ notes: 'Note without place ID' })
      });

      expect(res.status).toBe(400);
      const json = await res.json<{ code: string }>();
      expect(json.code).toBe('ERR_MISSING_PLACE_ID');
    });
  });

  describe('Pseudonymous Session Routes CRUD & Privacy Invariant (/saved/routes)', () => {
    it('saves a commute route and strips raw GPS coordinates (Invariant T-003 & RA 10173)', async () => {
      const sessionId = 'anon-session-xyz-789';

      const res = await app.request('/saved/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          route_id: 'r-lrt2-katipunan',
          notes: 'Morning shaded commute',
          route_data: {
            mode: 'rail',
            line: 'LRT-2',
            origin: 'Recto',
            destination: 'Katipunan',
            fare: 30,
            duration_minutes: 25,
            // Sensitive GPS coordinates to be stripped per T-003
            coordinates: [120.9822, 14.5828],
            latitude: 14.5828,
            longitude: 120.9822,
            point_geojson: { type: 'Point', coordinates: [120.9822, 14.5828] }
          }
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json<{ status: string; data: SavedItem }>();
      expect(json.data.item_type).toBe('route');
      expect(json.data.route_id).toBe('r-lrt2-katipunan');

      // Verify route_data is preserved but coordinates are completely stripped
      const routeData = json.data.route_data as Record<string, unknown>;
      expect(routeData.mode).toBe('rail');
      expect(routeData.line).toBe('LRT-2');
      expect(routeData.coordinates).toBeUndefined();
      expect(routeData.latitude).toBeUndefined();
      expect(routeData.longitude).toBeUndefined();
      expect(routeData.point_geojson).toBeUndefined();
    });

    it('returns 400 when both route_id and route_data are missing', async () => {
      const res = await app.request('/saved/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': 'session-test'
        },
        body: JSON.stringify({ notes: 'Route without reference' })
      });

      expect(res.status).toBe(400);
      const json = await res.json<{ code: string }>();
      expect(json.code).toBe('ERR_MISSING_ROUTE_REFERENCE');
    });

    it('retrieves and deletes saved routes', async () => {
      const sessionId = 'session-route-1';

      const createRes = await app.request('/saved/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ route_id: 'route-mrt-3' })
      });
      const created = await createRes.json<{ data: SavedItem }>();

      const fetchRes = await app.request('/saved/routes', {
        headers: { 'X-Session-ID': sessionId }
      });
      const fetchJson = await fetchRes.json<{ data: { items: SavedItem[] } }>();
      expect(fetchJson.data.items.length).toBe(1);

      const delRes = await app.request(`/saved/routes/${created.data.id}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionId }
      });
      expect(delRes.status).toBe(204);
    });
  });

  describe('User Session Isolation & Security', () => {
    it('strictly isolates saved items between distinct pseudonymous sessions', async () => {
      const sessionA = 'session-alice-001';
      const sessionB = 'session-bob-002';

      // Alice creates a bookmark
      const createRes = await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionA
        },
        body: JSON.stringify({ place_id: 'f0010000-0000-0000-0000-000000000020' })
      });
      const aliceItem = await createRes.json<{ data: SavedItem }>();

      // Bob fetches saved places
      const bobFetch = await app.request('/saved/places', {
        headers: { 'X-Session-ID': sessionB }
      });
      const bobJson = await bobFetch.json<{ data: { items: SavedItem[] } }>();
      expect(bobJson.data.items.length).toBe(0);

      // Bob attempts to delete Alice's bookmark
      const bobDelete = await app.request(`/saved/places/${aliceItem.data.id}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionB }
      });
      expect(bobDelete.status).toBe(404);

      // Verify Alice's bookmark remains intact
      const aliceFetch = await app.request('/saved/places', {
        headers: { 'X-Session-ID': sessionA }
      });
      const aliceJson = await aliceFetch.json<{ data: { items: SavedItem[] } }>();
      expect(aliceJson.data.items.length).toBe(1);
    });
  });

  describe('JWT Bearer Authenticated User Sync (F-005, A-M3-01)', () => {
    const userA = {
      sub: 'u1111111-1111-1111-1111-111111111111',
      email: 'user_a@lunhaw.ph',
      role: 'authenticated'
    };
    const userB = {
      sub: 'u2222222-2222-2222-2222-222222222222',
      email: 'user_b@lunhaw.ph',
      role: 'authenticated'
    };

    it('creates and persists bookmarks for authenticated JWT users', async () => {
      const token = createTestJwt(userA);

      const res = await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          place_id: 'f0010000-0000-0000-0000-000000000020',
          notes: 'Syncing to account'
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json<{ data: SavedItem }>();
      expect(json.data.user_id).toBe(userA.sub);
      expect(json.data.item_type).toBe('place');

      // Fetch user's saved items
      const fetchRes = await app.request('/saved/places', {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(fetchRes.status).toBe(200);
      const fetchJson = await fetchRes.json<{ data: { items: SavedItem[] } }>();
      expect(fetchJson.data.items.length).toBe(1);
      expect(fetchJson.data.items[0]!.user_id).toBe(userA.sub);
    });

    it('prevents user B from reading or deleting user A bookmarks', async () => {
      const tokenA = createTestJwt(userA);
      const tokenB = createTestJwt(userB);

      const createRes = await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({ place_id: 'f0010000-0000-0000-0000-000000000020' })
      });
      const createdItem = await createRes.json<{ data: SavedItem }>();

      // User B tries to delete User A's item
      const delRes = await app.request(`/saved/places/${createdItem.data.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      expect(delRes.status).toBe(404);

      // User B cannot see User A's items
      const fetchB = await app.request('/saved/places', {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      const fetchBJson = await fetchB.json<{ data: { items: SavedItem[] } }>();
      expect(fetchBJson.data.items.length).toBe(0);
    });

    it('returns 401 when token is expired or malformed', async () => {
      // Expired token (exp 1 hour in the past)
      const pastSeconds = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createTestJwt({ ...userA, exp: pastSeconds });

      const resExpired = await app.request('/saved/places', {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      expect(resExpired.status).toBe(401);
      const expiredJson = await resExpired.json<{ code: string }>();
      expect(expiredJson.code).toBe('ERR_TOKEN_EXPIRED');

      // Malformed token
      const resMalformed = await app.request('/saved/places', {
        headers: { Authorization: 'Bearer this.is.invalid_token' }
      });
      expect(resMalformed.status).toBe(401);
      const malformedJson = await resMalformed.json<{ code: string }>();
      expect(malformedJson.code).toBe('ERR_INVALID_AUTH_TOKEN');
    });

    it('migrates anonymous session items to user account on sync (/saved/sync)', async () => {
      const anonSessionId = 'local-device-device-999';

      // 1. Create anonymous bookmarks
      await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': anonSessionId
        },
        body: JSON.stringify({ place_id: 'f0010000-0000-0000-0000-000000000020' })
      });

      await app.request('/saved/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': anonSessionId
        },
        body: JSON.stringify({ route_id: 'route-lrt2' })
      });

      // 2. User logs in and calls /saved/sync with their session_id
      const token = createTestJwt(userA);
      const syncRes = await app.request('/saved/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: anonSessionId
        })
      });

      expect(syncRes.status).toBe(200);
      const syncJson = await syncRes.json<{
        status: string;
        data: { synced_count: number; migrated_count: number; items: SavedItem[] };
      }>();

      expect(syncJson.data.migrated_count).toBe(2);
      expect(syncJson.data.items.length).toBe(2);
      expect(syncJson.data.items.every((item) => item.user_id === userA.sub)).toBe(true);
    });

    it('returns 401 on /saved/sync when neither auth token nor session ID is supplied', async () => {
      const res = await app.request('/saved/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBe(401);
      const json = await res.json<{ code: string }>();
      expect(json.code).toBe('ERR_UNAUTHORIZED');
    });
  });
});
