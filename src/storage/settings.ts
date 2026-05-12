import type { ProviderId } from '../providers/types';

export type PrimaryService = ProviderId | 'auto';

export type Settings = {
  primary: PrimaryService;
  intervalMinutes: 1 | 5 | 15;
};

const KEY = 'settings';

export const DEFAULT_SETTINGS: Settings = {
  primary: 'auto',
  intervalMinutes: 5,
};

export async function readSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(data[KEY] as Partial<Settings>) };
}

export async function writeSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await readSettings()), ...patch };
  await chrome.storage.local.set({ [KEY]: next });
  return next;
}

export function onSettingsChanged(cb: (next: Settings) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ) => {
    if (area !== 'local' || !(KEY in changes)) return;
    cb({ ...DEFAULT_SETTINGS, ...(changes[KEY]!.newValue as Partial<Settings>) });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
