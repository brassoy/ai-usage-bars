export type ProviderId = 'claude';

export type UsageUnit = 'messages' | 'tokens' | 'pct';

export type UsageWindow = {
  used: number;
  limit: number;
  unit: UsageUnit;
  pct: number;
  resetAt: number | null;
};

export type UsageSnapshot = {
  providerId: ProviderId;
  session: UsageWindow;
  weekly: UsageWindow;
  authed: boolean;
  fetchedAt: number;
  error?: string;
};

export interface Provider {
  id: ProviderId;
  label: string;
  loginUrl: string;
  fetchUsage(): Promise<UsageSnapshot>;
}

export const emptyWindow = (unit: UsageUnit = 'pct'): UsageWindow => ({
  used: 0,
  limit: 0,
  unit,
  pct: 0,
  resetAt: null,
});

export const emptySnapshot = (providerId: ProviderId): UsageSnapshot => ({
  providerId,
  session: emptyWindow(),
  weekly: emptyWindow(),
  authed: false,
  fetchedAt: Date.now(),
});
