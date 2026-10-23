import { INSIGHT_API_URL, cloudInsightAvailable } from './cloud-insight';
import type { Insight } from './types';

/**
 * Sends an in-app report about a generated insight. The user's own reflection
 * text is never included — only the generated response and the reason.
 * Returns false when no report endpoint is configured or the request fails,
 * so the caller can fall back to email.
 */
export async function reportInsight(insight: Insight, reason: string): Promise<boolean> {
  if (!cloudInsightAvailable) return false;
  try {
    const response = await fetch(`${INSIGHT_API_URL}/v1/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason,
        themeId: insight.themeId,
        source: insight.source,
        interpretation: insight.interpretation,
        steps: insight.steps,
        prayer: insight.prayer,
        verseRefs: insight.verses.map((v) => v.ref),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
