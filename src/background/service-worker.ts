import { providers } from '../providers/registry';
import type { ProviderId, UsageSnapshot } from '../providers/types';
import { writeSnapshot, readSnapshots } from '../storage/cache';
import { readSettings, onSettingsChanged, type Settings } from '../storage/settings';
import { renderIcon, type IconState } from '../icon/render';

const ALARM_NAME = 'refresh-usage';

const t = (key: string, ...subs: string[]): string => {
  const msg = chrome.i18n.getMessage(key, subs.length ? subs : undefined);
  return msg || key;
};

// ── lifecycle ───────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  await ensureAlarm();
  await refreshAll();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarm();
  await refreshAll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) refreshAll();
});

onSettingsChanged(async (next) => {
  await ensureAlarm(next);
  await redrawIcon();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'refresh-now') {
    refreshAll().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

// ── alarm management ────────────────────────────────────────────────────

async function ensureAlarm(settings?: Settings) {
  const s = settings ?? (await readSettings());
  const existing = await chrome.alarms.get(ALARM_NAME);
  if (existing && existing.periodInMinutes === s.intervalMinutes) return;
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: s.intervalMinutes,
    delayInMinutes: s.intervalMinutes,
  });
}

// ── refresh loop ────────────────────────────────────────────────────────

async function refreshAll() {
  await Promise.all(
    providers.map(async (p) => {
      try {
        const snap = await p.fetchUsage();
        await writeSnapshot(snap);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await writeSnapshot({
          providerId: p.id,
          session: { used: 0, limit: 0, unit: 'pct', pct: 0, resetAt: null },
          weekly: { used: 0, limit: 0, unit: 'pct', pct: 0, resetAt: null },
          authed: false,
          fetchedAt: Date.now(),
          error: message,
        });
      }
    }),
  );
  await redrawIcon();
}

// ── icon rendering ──────────────────────────────────────────────────────

async function redrawIcon() {
  const settings = await readSettings();
  const snapshots = await readSnapshots();
  const primaryId = pickPrimary(settings.primary, snapshots);
  const primary = primaryId ? snapshots[primaryId] : undefined;

  let state: IconState;
  let title: string;
  if (!primary) {
    state = { kind: 'unauthed' };
    title = t('tooltip_waiting');
  } else if (!primary.authed) {
    state = { kind: 'unauthed' };
    title = t(
      'tooltip_sign_in',
      labelFor(primary.providerId),
      providers.find((p) => p.id === primary.providerId)?.loginUrl ?? '',
    );
  } else if (primary.error) {
    state = { kind: 'error' };
    title = `${labelFor(primary.providerId)} — ${primary.error}`;
  } else {
    state = { kind: 'usage', snapshot: primary };
    title = t(
      'tooltip_format',
      labelFor(primary.providerId),
      String(Math.round(primary.session.pct * 100)),
      String(Math.round(primary.weekly.pct * 100)),
    );
  }

  const imageData = renderIcon(state);
  await chrome.action.setIcon({ imageData: { 32: imageData } });
  await chrome.action.setTitle({ title });
}

function pickPrimary(
  pref: Settings['primary'],
  snaps: Partial<Record<ProviderId, UsageSnapshot>>,
): ProviderId | undefined {
  if (pref !== 'auto') return snaps[pref] ? pref : undefined;
  const candidates = Object.values(snaps).filter(Boolean) as UsageSnapshot[];
  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => maxPct(b) - maxPct(a));
  return candidates[0]!.providerId;
}

function maxPct(s: UsageSnapshot): number {
  if (!s.authed) return -1;
  return Math.max(s.session.pct, s.weekly.pct);
}

function labelFor(id: ProviderId): string {
  return providers.find((p) => p.id === id)?.label ?? id;
}
