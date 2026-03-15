import { load, type Store } from "@tauri-apps/plugin-store";
import type { AuthState, SyncRecord, GameSyncFingerprint } from "@/domain/types";

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
  const state = await s.get<AuthState>("auth");
  return state ?? { isAuthenticated: false };
}

export async function setAuthState(auth: AuthState): Promise<void> {
  const s = await getStore();
  await s.set("auth", auth);
}

export async function clearAuth(): Promise<void> {
  const s = await getStore();
  await s.delete("auth");
}

// Sync history
export async function getSyncHistory(): Promise<SyncRecord[]> {
  const s = await getStore();
  const history = await s.get<SyncRecord[]>("syncHistory");
  return history ?? [];
}

export async function addSyncRecord(record: SyncRecord): Promise<void> {
  const history = await getSyncHistory();
  history.unshift(record);
  // Keep last 100 records
  if (history.length > 100) history.length = 100;
  const s = await getStore();
  await s.set("syncHistory", history);
}

// Drive folder IDs cache
export async function getDriveFolderId(gameName: string): Promise<string | undefined> {
  const s = await getStore();
  const folders = await s.get<Record<string, string>>("driveFolders");
  return folders?.[gameName];
}

export async function setDriveFolderId(gameName: string, folderId: string): Promise<void> {
  const s = await getStore();
  const folders = (await s.get<Record<string, string>>("driveFolders")) ?? {};
  folders[gameName] = folderId;
  await s.set("driveFolders", folders);
}

// Watched games
export async function getWatchedGames(): Promise<string[]> {
  const s = await getStore();
  return (await s.get<string[]>("watchedGames")) ?? [];
}

export async function setWatchedGames(names: string[]): Promise<void> {
  const s = await getStore();
  await s.set("watchedGames", names);
}

// Sync fingerprints
export async function getSyncFingerprints(): Promise<Record<string, GameSyncFingerprint>> {
  const s = await getStore();
  return (await s.get<Record<string, GameSyncFingerprint>>("syncFingerprints")) ?? {};
}

export async function setSyncFingerprint(gameName: string, fingerprint: GameSyncFingerprint): Promise<void> {
  const s = await getStore();
  const all = (await s.get<Record<string, GameSyncFingerprint>>("syncFingerprints")) ?? {};
  all[gameName] = fingerprint;
  await s.set("syncFingerprints", all);
}
