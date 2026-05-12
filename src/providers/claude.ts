import type { Provider, UsageSnapshot, UsageWindow } from './types';
import { emptySnapshot } from './types';

const BASE = 'https://claude.ai';
const ORG_CACHE_KEY = 'claude:org_uuid';

type OrgListItem = { uuid: string; name?: string };

type ClaudeUsageResponse = {
  five_hour: { utilization: number; resets_at: string | null } | null;
  seven_day: { utilization: number; resets_at: string | null } | null;
  // The endpoint also returns seven_day_opus / seven_day_sonnet / extra_usage etc.
  // We only consume the aggregate fields for the icon and popup.
};

class AuthError extends Error {
  constructor() {
    super('Not signed in to claude.ai');
    this.name = 'AuthError';
  }
}

export const claudeProvider: Provider = {
  id: 'claude',
  label: 'Claude',
  loginUrl: 'https://claude.ai/settings/usage',

  async fetchUsage(): Promise<UsageSnapshot> {
    try {
      let orgId = await getCachedOrgId();
      let usage = orgId ? await tryFetchUsage(orgId) : null;
      if (usage === 'not-found') {
        await setCachedOrgId(null);
        orgId = null;
        usage = null;
      }
      if (!usage) {
        orgId = await discoverOrgId();
        await setCachedOrgId(orgId);
        usage = await tryFetchUsage(orgId);
        if (usage === 'not-found' || !usage) {
          throw new Error('Claude usage endpoint returned 404 after org discovery');
        }
      }
      return parseSnapshot(usage);
    } catch (err) {
      const snap = emptySnapshot('claude');
      if (err instanceof AuthError) {
        snap.authed = false;
      } else {
        snap.authed = false;
        snap.error = err instanceof Error ? err.message : String(err);
      }
      return snap;
    }
  },
};

// ── fetching ────────────────────────────────────────────────────────────

async function tryFetchUsage(
  orgId: string,
): Promise<ClaudeUsageResponse | 'not-found' | null> {
  const res = await fetch(`${BASE}/api/organizations/${orgId}/usage`, {
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) throw new AuthError();
  if (res.status === 404) return 'not-found';
  if (!res.ok) throw new Error(`Claude /usage returned ${res.status}`);
  return (await res.json()) as ClaudeUsageResponse;
}

async function discoverOrgId(): Promise<string> {
  const res = await fetch(`${BASE}/api/organizations`, {
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) throw new AuthError();
  if (!res.ok) throw new Error(`Claude /api/organizations returned ${res.status}`);
  const orgs = (await res.json()) as OrgListItem[];
  if (!Array.isArray(orgs) || orgs.length === 0) {
    throw new Error('Claude /api/organizations returned no orgs');
  }
  // The endpoint returns the user's active org(s). Pick the first.
  return orgs[0]!.uuid;
}

// ── caching ─────────────────────────────────────────────────────────────

async function getCachedOrgId(): Promise<string | null> {
  const data = await chrome.storage.local.get(ORG_CACHE_KEY);
  const value = data[ORG_CACHE_KEY];
  return typeof value === 'string' ? value : null;
}

async function setCachedOrgId(value: string | null): Promise<void> {
  if (value) {
    await chrome.storage.local.set({ [ORG_CACHE_KEY]: value });
  } else {
    await chrome.storage.local.remove(ORG_CACHE_KEY);
  }
}

// ── parsing ─────────────────────────────────────────────────────────────

function parseSnapshot(data: ClaudeUsageResponse): UsageSnapshot {
  return {
    providerId: 'claude',
    session: toWindow(data.five_hour),
    weekly: toWindow(data.seven_day),
    authed: true,
    fetchedAt: Date.now(),
  };
}

function toWindow(
  raw: { utilization: number; resets_at: string | null } | null,
): UsageWindow {
  if (!raw) {
    return { used: 0, limit: 0, unit: 'pct', pct: 0, resetAt: null };
  }
  const pct = Math.max(0, Math.min(1, raw.utilization / 100));
  return {
    used: raw.utilization,
    limit: 100,
    unit: 'pct',
    pct,
    resetAt: raw.resets_at ? new Date(raw.resets_at).getTime() : null,
  };
}
