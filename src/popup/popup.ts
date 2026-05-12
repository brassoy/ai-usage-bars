import { providers } from '../providers/registry';
import type { ProviderId, UsageSnapshot, UsageWindow } from '../providers/types';
import { onSnapshotsChanged, readSnapshots } from '../storage/cache';
import { localizeDom, t } from '../i18n';

const providersEl = document.getElementById('providers')!;
const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;
const updatedEl = document.getElementById('updated')!;
const openOptions = document.getElementById('open-options') as HTMLAnchorElement;

localizeDom();

openOptions.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  try {
    await chrome.runtime.sendMessage({ type: 'refresh-now' });
  } finally {
    refreshBtn.disabled = false;
  }
});

void render();
onSnapshotsChanged(() => void render());

async function render() {
  const snaps = await readSnapshots();
  providersEl.replaceChildren(
    ...providers.map((p) => renderProvider(p.id, p.label, p.loginUrl, snaps[p.id])),
  );
  const newest = newestFetchedAt(Object.values(snaps));
  updatedEl.textContent = newest ? t('updated_ago', formatRelative(newest)) : t('no_data_yet');
}

function renderProvider(
  id: ProviderId,
  label: string,
  loginUrl: string,
  snap: UsageSnapshot | undefined,
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'provider';
  card.dataset.provider = id;

  const head = document.createElement('div');
  head.className = 'provider-head';
  const name = document.createElement('div');
  name.className = 'provider-name';
  name.textContent = label;
  head.appendChild(name);

  const reset = document.createElement('div');
  reset.className = 'provider-reset';
  head.appendChild(reset);
  card.appendChild(head);

  if (!snap) {
    const empty = document.createElement('div');
    empty.className = 'signed-out';
    empty.textContent = t('provider_no_data');
    card.appendChild(empty);
    return card;
  }

  if (!snap.authed) {
    card.classList.add('unauthed');
    const msg = document.createElement('div');
    msg.className = 'signed-out';
    const text = document.createTextNode(t('not_signed_in') + ' ');
    const link = document.createElement('a');
    link.href = loginUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = t('open_provider', label);
    msg.append(text, link);
    card.appendChild(msg);
    return card;
  }

  if (snap.error) {
    const err = document.createElement('div');
    err.className = 'error';
    err.textContent = snap.error;
    card.appendChild(err);
  }

  card.appendChild(renderBar(t('session_5h'), snap.session));
  card.appendChild(renderBar(t('weekly'), snap.weekly));

  const resetParts: string[] = [];
  if (snap.session.resetAt) resetParts.push(t('session_in', formatUntil(snap.session.resetAt)));
  if (snap.weekly.resetAt) resetParts.push(t('weekly_in', formatUntil(snap.weekly.resetAt)));
  reset.textContent = resetParts.join(' · ');

  return card;
}

function renderBar(label: string, w: UsageWindow): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'bar';

  const head = document.createElement('div');
  head.className = 'bar-head';
  const left = document.createElement('span');
  left.textContent = `${label} · ${formatUsed(w)}`;
  const right = document.createElement('span');
  right.className = 'pct';
  right.textContent = `${Math.round(w.pct * 100)}%`;
  head.append(left, right);

  const track = document.createElement('div');
  track.className = 'bar-track';
  const fill = document.createElement('div');
  fill.className = `bar-fill ${severityClass(w.pct)}`;
  fill.style.width = `${Math.max(0, Math.min(100, w.pct * 100))}%`;
  track.appendChild(fill);

  wrap.append(head, track);
  return wrap;
}

function severityClass(pct: number): string {
  if (pct >= 0.85) return 'crit';
  if (pct >= 0.6) return 'warn';
  return 'ok';
}

function formatUsed(w: UsageWindow): string {
  if (w.unit === 'pct' || w.limit === 0) return `${Math.round(w.pct * 100)}%`;
  return `${formatNumber(w.used)} / ${formatNumber(w.limit)}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function newestFetchedAt(snaps: Array<UsageSnapshot | undefined>): number | null {
  const ts = snaps.filter((s): s is UsageSnapshot => !!s).map((s) => s.fetchedAt);
  if (ts.length === 0) return null;
  return Math.max(...ts);
}

function formatRelative(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 5) return t('just_now');
  if (s < 60) return t('seconds_ago', String(s));
  const m = Math.floor(s / 60);
  if (m < 60) return t('minutes_ago', String(m));
  const h = Math.floor(m / 60);
  if (h < 24) return t('hours_ago', String(h));
  return new Date(ts).toLocaleString();
}

function formatUntil(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return t('time_now');
  const m = Math.floor(diff / 60_000);
  if (m < 60) return t('time_m', String(m));
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? t('time_h_m', String(h), String(rm)) : t('time_h', String(h));
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? t('time_d_h', String(d), String(rh)) : t('time_d', String(d));
}
