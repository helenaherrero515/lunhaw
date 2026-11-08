import { Hono } from 'hono';
import type { Env, ProblemDetails } from '../types/index.js';
import { isPublicEnvironment } from '../data/places-source.js';

/**
 * POST /newsletter — "Stay in the loop" sign-ups from the landing page footer.
 *
 * Stores { email, consent } in Supabase `newsletter_signups` using the service-role key (the table is
 * not readable or writable by clients). The response is the same whether or not the email was already
 * on the list, so the endpoint can't be used to check who has signed up.
 */
export const newsletterRoute = new Hono<{ Bindings: Env }>();

export const NEWSLETTER_CONSENT_TEXT =
  'I agree to receive occasional emails about Lunhaw and know I can unsubscribe at any time. See the Privacy Notice.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Local development / tests only: keeps sign-ups in memory instead of a database.
const devStore = new Set<string>();
export function resetNewsletterStore(): void {
  devStore.clear();
}
export function getNewsletterStore(): readonly string[] {
  return [...devStore];
}

function problem(c: { req: { path: string } }, status: number, code: string, title: string, detail: string): ProblemDetails {
  return { type: `https://api.lunhaw.ph/errors/${code}`, title, status, detail, instance: c.req.path, code };
}

newsletterRoute.post('/', async (c) => {
  let body: { email?: unknown; consent?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json(problem(c, 400, 'ERR_BAD_REQUEST', 'Invalid Body', 'Expected a JSON body.'), 400, {
      'Content-Type': 'application/problem+json'
    });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return c.json(problem(c, 400, 'ERR_INVALID_EMAIL', 'Invalid Email', 'Please enter a valid email.'), 400, {
      'Content-Type': 'application/problem+json'
    });
  }
  if (body.consent !== true) {
    return c.json(problem(c, 400, 'ERR_CONSENT_REQUIRED', 'Consent Required', 'Consent is required to sign up.'), 400, {
      'Content-Type': 'application/problem+json'
    });
  }

  const env = c.env;
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    if (isPublicEnvironment(env)) {
      return c.json(
        problem(c, 503, 'ERR_DATA_SOURCE_UNAVAILABLE', 'Sign-ups Unavailable', 'Newsletter sign-ups are not configured.'),
        503,
        { 'Content-Type': 'application/problem+json' }
      );
    }
    devStore.add(email.toLowerCase());
    return c.json({ status: 'success' }, 201);
  }

  const res = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/newsletter_signups`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ email, consent_given: true, consent_text: NEWSLETTER_CONSENT_TEXT, source: 'landing_footer' })
  }).catch(() => null);

  // 409 = already signed up: answer exactly like a new sign-up.
  if (res && (res.ok || res.status === 409)) {
    return c.json({ status: 'success' }, 201);
  }
  return c.json(
    problem(c, 503, 'ERR_DATA_SOURCE_UNAVAILABLE', 'Sign-ups Unavailable', 'Could not save the sign-up. Please try again later.'),
    503,
    { 'Content-Type': 'application/problem+json' }
  );
});
