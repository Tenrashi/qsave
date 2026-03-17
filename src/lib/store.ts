import { load, type Store } from "@tauri-apps/plugin-store";
import type { AuthState, SyncRecord, GameSyncFingerprint } from "@/domain/types";
import { STORE_KEYS, MAX_SYNC_HISTORY_RECORDS } from "@/lib/constants";

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await load("qsave-data.json", { autoSave: true, defaults: {} });
  }
  return store;
}

// Auth
export async function getAuthState(): Promise<AuthState> {
  const s = await getStore();
  const state = await s.get<AuthState>(STORE_KEYS.auth);
  return state ?? { isAuthenticated: false };
}

export async function setAuthState(auth: AuthState): Promise<void> {
  const s = await getStore();
  await s.set(STORE_KEYS.auth, auth);
}

export async function clearAuth(): Promise<void> {
  const s = await getStore();
  await s.delete(STORE_KEYS.auth);
}

// Sync history
export async function getSyncHistory(): Promise<SyncRecord[]> {
  const s = await getStore();
  const history = await s.get<SyncRecord[]>(STORE_KEYS.syncHistory);
  return history ?? [];
}

export async function addSyncRecord(record: SyncRecord): Promise<void> {
  const history = await getSyncHistory();
  history.unshift(record);
  if (history.length > MAX_SYNC_HISTORY_RECORDS) history.length = MAX_SYNC_HISTORY_RECORDS;
  const s = await getStore();
  await s.set(STORE_KEYS.syncHistory, history);
}

// Drive folder IDs cache
export async function getDriveFolderId(gameName: string): Promise<string | undefined> {
  const s = await getStore();
  const folders = await s.get<Record<string, string>>(STORE_KEYS.driveFolders);
  return folders?.[gameName];
}

export async function setDriveFolderId(gameName: string, folderId: string): Promise<void> {
  const s = await getStore();
  const folders = (await s.get<Record<string, string>>(STORE_KEYS.driveFolders)) ?? {};
  folders[gameName] = folderId;
  await s.set(STORE_KEYS.driveFolders, folders);
}

// Watched games
export async function getWatchedGames(): Promise<string[]> {
  const s = await getStore();
  return (await s.get<string[]>(STORE_KEYS.watchedGames)) ?? [];
}

export async function setWatchedGames(names: string[]): Promise<void> {
  const s = await getStore();
  await s.set(STORE_KEYS.watchedGames, names);
}

// Manual games
export type ManualGameEntry = { name: string; paths: string[] };

export async function getManualGames(): Promise<ManualGameEntry[]> {
  const s = await getStore();
  return (await s.get<ManualGameEntry[]>(STORE_KEYS.manualGames)) ?? [];
}

export async function setManualGames(games: ManualGameEntry[]): Promise<void> {
  const s = await getStore();
  await s.set(STORE_KEYS.manualGames, games);
}

export async function addManualGame(name: string, paths: string[]): Promise<void> {
  const games = await getManualGames();
  const existing = games.findIndex((g) => g.name === name);
  if (existing >= 0) {
    games[existing] = { name, paths };
    return setManualGames(games);
  }
  games.push({ name, paths });
  await setManualGames(games);
}

export async function removeManualGame(name: string): Promise<void> {
  const games = await getManualGames();
  await setManualGames(games.filter((g) => g.name !== name));
}

// Sync fingerprints
export async function getSyncFingerprints(): Promise<Record<string, GameSyncFingerprint>> {
  const s = await getStore();
  return (await s.get<Record<string, GameSyncFingerprint>>(STORE_KEYS.syncFingerprints)) ?? {};
}

export async function setSyncFingerprint(gameName: string, fingerprint: GameSyncFingerprint): Promise<void> {
  const s = await getStore();
  const all = (await s.get<Record<string, GameSyncFingerprint>>(STORE_KEYS.syncFingerprints)) ?? {};
  all[gameName] = fingerprint;
  await s.set(STORE_KEYS.syncFingerprints, all);
}
