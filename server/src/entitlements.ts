import type { Plan } from './usage.ts';

/**
 * Subscription status, checked with RevenueCat's REST API using a secret key.
 * The app identifies purchases by the same install ID it sends here, so a client
 * can never claim a plan it has not paid for. Without REVENUECAT_SECRET_KEY,
 * everyone is on the free plan.
 */
const SECRET_KEY = process.env.REVENUECAT_SECRET_KEY ?? '';
const ENTITLEMENT = process.env.REVENUECAT_ENTITLEMENT ?? 'plus';
const PLUS_TTL_MS = 10 * 60 * 1000;
const FREE_TTL_MS = 60 * 1000;
const REFRESH_COOLDOWN_MS = 10 * 1000;

export const subscriptionsEnabled = SECRET_KEY.length > 0;

const cache = new Map<string, { plan: Plan; fetchedAt: number; expiresAt: number }>();

type SubscriberResponse = {
  subscriber?: { entitlements?: Record<string, { expires_date?: string | null; grace_period_expires_date?: string | null }> };
};

/** True if the entitlement is active now (lifetime, unexpired, or in a billing grace period). */
export function hasActiveEntitlement(body: SubscriberResponse, entitlement: string, now = Date.now()): boolean {
  const e = body.subscriber?.entitlements?.[entitlement];
  if (!e) return false;
  if (!e.expires_date) return true;
  const until = Math.max(Date.parse(e.expires_date), e.grace_period_expires_date ? Date.parse(e.grace_period_expires_date) : 0);
  return until > now;
}

/** Resolves the user's plan. Throws if RevenueCat cannot be reached and nothing is cached. */
export async function planFor(user: string, options: { refresh?: boolean } = {}): Promise<Plan> {
  if (!subscriptionsEnabled) return 'free';
  const now = Date.now();
  const hit = cache.get(user);
  const canRefresh = !hit || now - hit.fetchedAt > REFRESH_COOLDOWN_MS;
  if (hit && hit.expiresAt > now && !(options.refresh && canRefresh)) return hit.plan;

  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user)}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`RevenueCat returned ${response.status}`);
    const plan: Plan = hasActiveEntitlement((await response.json()) as SubscriberResponse, ENTITLEMENT, now) ? 'plus' : 'free';
    cache.set(user, { plan, fetchedAt: now, expiresAt: now + (plan === 'plus' ? PLUS_TTL_MS : FREE_TTL_MS) });
    if (cache.size > 50_000) for (const [key, value] of cache) if (value.expiresAt < now) cache.delete(key);
    return plan;
  } catch (error) {
    console.error(JSON.stringify({ event: 'entitlement_error', message: (error as Error).message }));
    if (hit) return hit.plan;
    throw error;
  }
}
