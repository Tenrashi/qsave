import type { DeviceEntry, DevicesMap } from "./devices.types";
import {
  getDeviceFile,
  getFile,
  getFilesInFolder,
  putDeviceFile,
} from "@/services/drive/drive";
import { ensureDevicesFolder } from "@/operations/drive/folders/folders";

const currentOS = (): string => {
  const platform = navigator.platform;
  if (platform.startsWith("Win")) return "windows";
  if (platform.startsWith("Mac")) return "macos";
  return "linux";
};

export const buildDevicesMap = async (): Promise<DevicesMap> => {
  try {
    const folderId = await ensureDevicesFolder();
    const files = await getFilesInFolder(folderId);
    const entries = await Promise.all(
      files.map(async (file) => {
        const entry = await getDeviceFile(file.id);
        if (!entry) return null;
        const deviceId = file.name.replace(/\.json$/, "");
        return [deviceId, entry] as const;
      }),
    );
    return Object.fromEntries(
      entries.filter(
        (entry): entry is readonly [string, DeviceEntry] => entry !== null,
      ),
    );
  } catch {
    return {};
  }
};

export const findDeviceGamePaths = async (
  deviceId: string,
  gameName: string,
): Promise<string[] | undefined> => {
  try {
    const folderId = await ensureDevicesFolder();
    const fileId = await getFile(`${deviceId}.json`, folderId);
    if (!fileId) return undefined;

    const entry = await getDeviceFile(fileId);
    return entry?.games[gameName];
  } catch {
    return undefined;
  }
};

export const saveDevicePaths = async (
  deviceId: string,
  gameName: string,
  paths: string[],
): Promise<void> => {
  try {
    const folderId = await ensureDevicesFolder();
    const existingFileId = await getFile(`${deviceId}.json`, folderId);
    let entry: DeviceEntry = { os: currentOS(), games: {} };

    if (existingFileId) {
      const existing = await getDeviceFile(existingFileId);
      if (existing) entry = existing;
    }

    entry.games[gameName] = paths;
    await putDeviceFile(folderId, deviceId, entry, existingFileId);
  } catch (error) {
    throw new Error(
      `Failed to update device paths: ${error instanceof Error ? error.message : error}`,
      { cause: error },
    );
  }
};
