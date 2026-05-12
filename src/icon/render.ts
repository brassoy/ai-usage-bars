import type { UsageSnapshot } from '../providers/types';

const SIZE = 32;
const PADDING = 3;
const BAR_HEIGHT = 8;
const BAR_GAP = 4;
const RADIUS = 2;

const COLORS = {
  bg: 'rgba(0, 0, 0, 0)',
  track: '#3a3a3f',
  ok: '#3fb950',
  warn: '#d29922',
  crit: '#f85149',
  muted: '#6e6e74',
  text: '#ececec',
} as const;

function fillFor(pct: number): string {
  if (pct >= 0.85) return COLORS.crit;
  if (pct >= 0.6) return COLORS.warn;
  return COLORS.ok;
}

function roundedRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export type IconState =
  | { kind: 'usage'; snapshot: UsageSnapshot }
  | { kind: 'unauthed' }
  | { kind: 'error' };

export function renderIcon(state: IconState): ImageData {
  const canvas = new OffscreenCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas 2d context not available');

  ctx.clearRect(0, 0, SIZE, SIZE);

  if (state.kind === 'unauthed' || state.kind === 'error') {
    ctx.fillStyle = state.kind === 'error' ? COLORS.crit : COLORS.muted;
    roundedRect(ctx, 2, 2, SIZE - 4, SIZE - 4, 5);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.kind === 'error' ? '!' : '?', SIZE / 2, SIZE / 2 + 1);
    return ctx.getImageData(0, 0, SIZE, SIZE);
  }

  const { session, weekly } = state.snapshot;
  const barWidth = SIZE - PADDING * 2;
  const totalH = BAR_HEIGHT * 2 + BAR_GAP;
  const startY = Math.round((SIZE - totalH) / 2);

  drawBar(ctx, PADDING, startY, barWidth, BAR_HEIGHT, session.pct);
  drawBar(ctx, PADDING, startY + BAR_HEIGHT + BAR_GAP, barWidth, BAR_HEIGHT, weekly.pct);

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

function drawBar(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number,
) {
  // track
  ctx.fillStyle = COLORS.track;
  roundedRect(ctx, x, y, w, h, RADIUS);
  ctx.fill();

  // fill
  const clamped = Math.max(0, Math.min(1, pct));
  if (clamped <= 0) return;
  const fillW = Math.max(2, Math.round(w * clamped));
  ctx.fillStyle = fillFor(clamped);
  roundedRect(ctx, x, y, fillW, h, RADIUS);
  ctx.fill();
}
