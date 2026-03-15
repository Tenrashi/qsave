import { invoke } from "@tauri-apps/api/core";

export const notify = async (title: string, body: string): Promise<void> => {
  try {
    await invoke("send_native_notification", { title, body });
  } catch (err) {
    console.warn("[notify] Failed:", err);
  }
};
