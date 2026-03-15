import type { Game, SyncRecord } from "@/domain/types";
import { uploadGameArchive } from "@/services/drive";
import { addSyncRecord } from "@/lib/store";
import { notify } from "@/lib/notify";

export const syncGame = async (game: Game): Promise<SyncRecord> => {
  const id = `${game.name}-${Date.now()}`;
  const filePaths = game.saveFiles.map((f) => f.path);

  try {
    const { fileId } = await uploadGameArchive(game.name, filePaths);

    const record: SyncRecord = {
      id,
      gameName: game.name,
      fileName: `${game.name}.zip`,
      syncedAt: new Date(),
      driveFileId: fileId,
      revisionCount: 1,
      status: "success",
    };

    await addSyncRecord(record);
    await notify("QSave", `${game.name}: ${game.saveFiles.length} save(s) synced`);
    return record;
  } catch (err) {
    const record: SyncRecord = {
      id,
      gameName: game.name,
      fileName: `${game.name}.zip`,
      syncedAt: new Date(),
      driveFileId: "",
      revisionCount: 0,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };

    await addSyncRecord(record);
    await notify("QSave", `${game.name}: sync failed`);
    return record;
  }
};

export const syncAllGames = async (games: Game[]): Promise<SyncRecord[]> => {
  const results: SyncRecord[] = [];
  for (const game of games) {
    const record = await syncGame(game);
    results.push(record);
  }
  return results;
};
