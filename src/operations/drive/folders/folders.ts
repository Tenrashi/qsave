import { APP_NAME, STORE_KEYS } from "@/lib/constants/constants";
import { getDriveFolderId, setDriveFolderId } from "@/lib/store/store";
import { getFolder, postFolder } from "@/services/drive/drive";

const DEVICES_FOLDER_NAME = "devices";

export const ensureQSaveFolder = async (): Promise<string> => {
  try {
    const cached = await getDriveFolderId(STORE_KEYS.rootFolder);
    if (cached) {
      const found = await getFolder(APP_NAME, "root");
      if (found === cached) return cached;
    }

    const existing = await getFolder(APP_NAME, "root");
    if (existing) {
      await setDriveFolderId(STORE_KEYS.rootFolder, existing);
      return existing;
    }

    const id = await postFolder(APP_NAME, "root");
    await setDriveFolderId(STORE_KEYS.rootFolder, id);
    return id;
  } catch (error) {
    throw new Error(
      `Failed to ensure ${APP_NAME} folder: ${error instanceof Error ? error.message : error}`,
      { cause: error },
    );
  }
};

export const ensureGameFolder = async (gameName: string): Promise<string> => {
  try {
    const rootId = await ensureQSaveFolder();

    const cached = await getDriveFolderId(gameName);
    if (cached) {
      const found = await getFolder(gameName, rootId);
      if (found === cached) return cached;
    }

    const existing = await getFolder(gameName, rootId);
    if (existing) {
      await setDriveFolderId(gameName, existing);
      return existing;
    }

    const id = await postFolder(gameName, rootId);
    await setDriveFolderId(gameName, id);
    return id;
  } catch (error) {
    throw new Error(
      `Failed to ensure game folder "${gameName}": ${error instanceof Error ? error.message : error}`,
      { cause: error },
    );
  }
};

export const ensureDevicesFolder = async (): Promise<string> => {
  try {
    const rootId = await ensureQSaveFolder();

    const cached = await getDriveFolderId(DEVICES_FOLDER_NAME);
    if (cached) return cached;

    const existing = await getFolder(DEVICES_FOLDER_NAME, rootId);
    if (existing) {
      await setDriveFolderId(DEVICES_FOLDER_NAME, existing);
      return existing;
    }

    const id = await postFolder(DEVICES_FOLDER_NAME, rootId);
    await setDriveFolderId(DEVICES_FOLDER_NAME, id);
    return id;
  } catch (error) {
    throw new Error(
      `Failed to ensure devices folder: ${error instanceof Error ? error.message : error}`,
      { cause: error },
    );
  }
};
