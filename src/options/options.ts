import { readSettings, writeSettings, type Settings } from '../storage/settings';
import { localizeDom, t } from '../i18n';

const intervalSel = document.getElementById('interval') as HTMLSelectElement;
const statusEl = document.getElementById('status')!;

localizeDom();
void init();

async function init() {
  const s = await readSettings();
  intervalSel.value = String(s.intervalMinutes);

  intervalSel.addEventListener('change', () =>
    save({ intervalMinutes: Number(intervalSel.value) as Settings['intervalMinutes'] }),
  );
}

let pendingTimer: number | undefined;
async function save(patch: Partial<Settings>) {
  await writeSettings(patch);
  statusEl.textContent = t('options_saved');
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => (statusEl.textContent = ''), 1500) as unknown as number;
}
