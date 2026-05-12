import type { Provider, UsageSnapshot } from './types';

const FIVE_HOURS = 5 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const wave = (period: number, phase: number) =>
  0.5 + 0.4 * Math.sin((Date.now() / period) * 2 * Math.PI + phase);

function makeSnapshot(seed: number): UsageSnapshot {
  const sessionPct = wave(60_000, seed);
  const weeklyPct = wave(300_000, seed + 1);
  return {
    providerId: 'claude',
    session: {
      used: Math.round(sessionPct * 100),
      limit: 100,
      unit: 'messages',
      pct: sessionPct,
      resetAt: Date.now() + FIVE_HOURS,
    },
    weekly: {
      used: Math.round(weeklyPct * 1000),
      limit: 1000,
      unit: 'messages',
      pct: weeklyPct,
      resetAt: Date.now() + SEVEN_DAYS,
    },
    authed: true,
    fetchedAt: Date.now(),
  };
}

export const mockClaude: Provider = {
  id: 'claude',
  label: 'Claude (mock)',
  loginUrl: 'https://claude.ai/settings/usage',
  fetchUsage: async () => makeSnapshot(0),
};
