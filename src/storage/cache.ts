import type { ProviderId, UsageSnapshot } from '../providers/types';

const KEY = 'cache:snapshots';

type CacheShape = Partial<Record<ProviderId, UsageSnapshot>>;

export async function readSnapshots(): Promise<CacheShape> {
  const data = await chrome.storage.local.get(KEY);
  return (data[KEY] as CacheShape) ?? {};
}

export async function writeSnapshot(snap: UsageSnapshot): Promise<void> {
  const current = await readSnapshots();
  current[snap.providerId] = snap;
  await chrome.storage.local.set({ [KEY]: current });
}

export async function readSnapshot(id: ProviderId): Promise<UsageSnapshot | undefined> {
  const all = await readSnapshots();
  return all[id];
}

export function onSnapshotsChanged(
  cb: (next: CacheShape) => void,
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ) => {
    if (area !== 'local' || !(KEY in changes)) return;
    cb((changes[KEY]!.newValue as CacheShape) ?? {});
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
