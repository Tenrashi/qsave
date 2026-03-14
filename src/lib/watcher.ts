import { watchImmediate, type UnwatchFn } from "@tauri-apps/plugin-fs";

type WatchCallback = (paths: string[]) => void;

const watchers = new Map<string, UnwatchFn>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

const DEBOUNCE_MS = 2000;

export async function startWatching(
  directories: string[],
  onChange: WatchCallback,
): Promise<void> {
  for (const dir of directories) {
    if (watchers.has(dir)) continue;

    try {
      const unwatch = await watchImmediate(dir, (event) => {
        const paths = Array.isArray(event.paths) ? event.paths : [event.paths];
        const changedPaths = paths.filter((p): p is string => typeof p === "string");
        if (changedPaths.length === 0) return;

        // Debounce: games often write temp file + rename
        const existing = debounceTimers.get(dir);
        if (existing) clearTimeout(existing);

        debounceTimers.set(
          dir,
          setTimeout(() => {
            debounceTimers.delete(dir);
            onChange(changedPaths);
          }, DEBOUNCE_MS),
        );
      }, { recursive: true });

      watchers.set(dir, unwatch);
    } catch (err) {
      console.error(`Failed to watch ${dir}:`, err);
    }
  }
}

export async function stopWatching(directory?: string): Promise<void> {
  if (directory) {
    const unwatch = watchers.get(directory);
    if (unwatch) {
      unwatch();
      watchers.delete(directory);
    }
    const timer = debounceTimers.get(directory);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(directory);
    }
  } else {
    for (const unwatch of watchers.values()) {
      unwatch();
    }
    watchers.clear();
    for (const timer of debounceTimers.values()) {
      clearTimeout(timer);
    }
    debounceTimers.clear();
  }
}

export const getWatchedDirectories = (): string[] => {
  return Array.from(watchers.keys());
};
