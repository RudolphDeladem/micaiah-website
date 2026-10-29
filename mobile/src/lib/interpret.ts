import { normalizeRef, type ScriptureRef } from './bible';
import { INSIGHT_API_URL, cloudInsightAvailable } from './cloud-insight';
import { detectCrisis } from './crisis';
import { getInstallId } from './install-id';
import type { Interpretation, InterpretationKind, InterpretationPoint } from './types';

/** Dream and prophetic interpretation always need the AI service, so they exist only when it is configured. */
export const interpretAvailable = cloudInsightAvailable;

/**
 * Builds without the AI service show Dream Interpretation, Prophetic Word and Micaiah Plus as
 * "Coming soon" so testers can preview them. App Store review rejects placeholder features, so
 * set EXPO_PUBLIC_HIDE_COMING_SOON=1 for a store build that ships without the service.
 */
export const interpretComingSoon = !interpretAvailable && process.env.EXPO_PUBLIC_HIDE_COMING_SOON !== '1';

export const MIN_INTERPRET_LENGTH = 10;
export const MAX_INTERPRET_LENGTH = 5000;
const REQUEST_TIMEOUT_MS = 60_000;

export type UsageCount = { used: number; limit: number };

export type Usage = {
  plan: 'free' | 'plus';
  subscriptionsEnabled: boolean;
  /** ISO time the monthly counts reset. */
  resetsAt: string;
  /** Monthly allowance per kind on each plan. */
  limits: { free: number; plus: number };
  dream: UsageCount;
  prophetic: UsageCount;
};

export class LimitReachedError extends Error {
  readonly usage: Usage | null;
  constructor(usage: Usage | null) {
    super('Monthly limit reached');
    this.usage = usage;
  }
}

export function remaining(usage: Usage | null, kind: InterpretationKind): number | null {
  return usage ? Math.max(0, usage[kind].limit - usage[kind].used) : null;
}

const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

export function parseUsage(payload: unknown): Usage | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const count = (v: unknown): UsageCount | null => {
    const c = v as Partial<UsageCount> | undefined;
    return c && isCount(c.used) && isCount(c.limit) ? { used: c.used, limit: c.limit } : null;
  };
  const limits = p.limits as Partial<Usage['limits']> | undefined;
  const dream = count(p.dream);
  const prophetic = count(p.prophetic);
  if (p.plan !== 'free' && p.plan !== 'plus') return null;
  if (!dream || !prophetic || !limits || !isCount(limits.free) || !isCount(limits.plus)) return null;
  return {
    plan: p.plan,
    subscriptionsEnabled: p.subscriptionsEnabled === true,
    resetsAt: typeof p.resetsAt === 'string' ? p.resetsAt : '',
    limits: { free: limits.free, plus: limits.plus },
    dream,
    prophetic,
  };
}

function cleanString(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, max) : null;
}

function cleanStrings(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => cleanString(v, maxLength))
    .filter((v): v is string => v !== null)
    .slice(0, maxItems);
}

function cleanRefs(value: unknown, max: number): ScriptureRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((r) => normalizeRef(r))
    .filter((r): r is ScriptureRef => r !== null)
    .slice(0, max);
}

/** Validates an untrusted interpretation payload from the service. */
export function parseInterpretation(
  payload: unknown,
  kind: InterpretationKind,
  text: string,
): Omit<Interpretation, 'id' | 'createdAt'> | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const title = cleanString(p.title, 80);
  const summary = cleanString(p.summary, 2000);
  const prayer = cleanString(p.prayer, 1000);
  if (!title || !summary || !prayer) return null;
  const points: InterpretationPoint[] = Array.isArray(p.points)
    ? p.points
        .map((pt) => {
          const point = (pt ?? {}) as Record<string, unknown>;
          const heading = cleanString(point.heading, 80);
          const body = cleanString(point.body, 800);
          return heading && body ? { heading, body, refs: cleanRefs(point.refs, 2) } : null;
        })
        .filter((pt): pt is InterpretationPoint => pt !== null)
        .slice(0, 5)
    : [];
  const steps = cleanStrings(p.steps, 3, 300);
  if (steps.length === 0) return null;
  return {
    kind,
    text,
    title,
    summary,
    points,
    refs: cleanRefs(p.refs, 3),
    cautions: cleanStrings(p.cautions, 3, 400),
    steps,
    prayer,
    crisis: detectCrisis(text) || p.crisis === true,
  };
}

async function request(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 15_000);
  const abort = () => controller.abort();
  init.signal?.addEventListener('abort', abort);
  try {
    return await fetch(`${INSIGHT_API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-Micaiah-User': await getInstallId(), ...init.headers },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abort);
  }
}

/** Current plan and monthly usage. `refresh` asks the server to re-check the subscription (after a purchase). */
export async function fetchUsage(refresh = false): Promise<Usage> {
  const response = await request(`/v1/usage${refresh ? '?refresh=1' : ''}`);
  if (!response.ok) throw new Error(`Usage request failed (${response.status})`);
  const usage = parseUsage(await response.json());
  if (!usage) throw new Error('Invalid usage response');
  return usage;
}

export async function requestInterpretation(
  kind: InterpretationKind,
  text: string,
  signal?: AbortSignal,
): Promise<{ interpretation: Omit<Interpretation, 'id' | 'createdAt'>; usage: Usage | null }> {
  const response = await request('/v1/interpret', {
    method: 'POST',
    body: JSON.stringify({ kind, text }),
    signal,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (response.status === 402) throw new LimitReachedError(parseUsage(body?.usage));
  if (!response.ok) throw new Error(`Interpretation request failed (${response.status})`);
  const interpretation = parseInterpretation(body?.interpretation, kind, text);
  if (!interpretation) throw new Error('Invalid interpretation response');
  return { interpretation, usage: parseUsage(body?.usage) };
}
