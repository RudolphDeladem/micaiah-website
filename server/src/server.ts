import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import Anthropic from '@anthropic-ai/sdk';

import { RefusalError, generateInsight } from './insight.ts';
import { RateLimiter, parseInsightRequest } from './validation.ts';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 16 * 1024;
const insightLimiter = new RateLimiter(Number(process.env.RATE_LIMIT_PER_HOUR ?? 30), 60 * 60 * 1000);
const reportLimiter = new RateLimiter(20, 60 * 60 * 1000);

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function clientKey(req: IncomingMessage): string {
  // Behind a proxy (Fly, Render, Cloud Run…) the client IP is the first X-Forwarded-For hop.
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error('too-large');
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleInsight(req: IncomingMessage, res: ServerResponse) {
  if (!insightLimiter.allow(clientKey(req))) return send(res, 429, { error: 'Too many requests, try again later' });
  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: 'Invalid JSON body' });
  }
  const parsed = parseInsightRequest(body);
  if (typeof parsed === 'string') return send(res, 400, { error: parsed });

  try {
    const insight = await generateInsight(parsed.text, parsed.mode);
    // Reflection text is never logged or stored.
    return send(res, 200, insight);
  } catch (error) {
    if (error instanceof RefusalError) return send(res, 422, { error: 'Unable to generate an insight for this reflection' });
    if (error instanceof Anthropic.RateLimitError) return send(res, 503, { error: 'Service busy, try again shortly' });
    if (error instanceof Anthropic.APIError) {
      console.error(JSON.stringify({ event: 'anthropic_error', status: error.status, message: error.message }));
      return send(res, 502, { error: 'Insight service unavailable' });
    }
    console.error(JSON.stringify({ event: 'insight_error', message: (error as Error).message }));
    return send(res, 500, { error: 'Internal error' });
  }
}

async function handleReport(req: IncomingMessage, res: ServerResponse) {
  if (!reportLimiter.allow(clientKey(req))) return send(res, 429, { error: 'Too many reports' });
  let body: Record<string, unknown>;
  try {
    body = (await readJson(req)) as Record<string, unknown>;
  } catch {
    return send(res, 400, { error: 'Invalid JSON body' });
  }
  if (typeof body?.reason !== 'string') return send(res, 400, { error: '"reason" is required' });
  // Reports contain only the generated response, never the user's reflection.
  // Structured log line: route your platform's logs to wherever you review reports.
  console.log(
    JSON.stringify({
      event: 'insight_report',
      at: new Date().toISOString(),
      reason: String(body.reason).slice(0, 200),
      themeId: String(body.themeId ?? '').slice(0, 40),
      source: String(body.source ?? '').slice(0, 20),
      interpretation: String(body.interpretation ?? '').slice(0, 2000),
      steps: Array.isArray(body.steps) ? body.steps.slice(0, 5).map((s) => String(s).slice(0, 300)) : [],
      prayer: String(body.prayer ?? '').slice(0, 1000),
      verseRefs: Array.isArray(body.verseRefs) ? body.verseRefs.slice(0, 5).map((s) => String(s).slice(0, 60)) : [],
    }),
  );
  return send(res, 202, { ok: true });
}

const server = createServer((req, res) => {
  const url = req.url?.split('?')[0];
  if (req.method === 'GET' && url === '/health') return send(res, 200, { ok: true });
  if (req.method === 'POST' && url === '/v1/insight') return void handleInsight(req, res);
  if (req.method === 'POST' && url === '/v1/report') return void handleReport(req, res);
  return send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(JSON.stringify({ event: 'listening', port: PORT })));
