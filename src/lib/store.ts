import { load, type Store } from "@tauri-apps/plugin-store";
import type { AuthState, SyncRecord } from "@/domain/types";

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
