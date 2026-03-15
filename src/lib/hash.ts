import type { SaveFile } from "@/domain/types";

const simpleHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return (hash >>> 0).toString(36);
};

export const computeGameHash = (saveFiles: SaveFile[]): string => {
  const sorted = [...saveFiles].sort((a, b) => a.path.localeCompare(b.path));
  const parts = sorted.map(
    (f) => `${f.path}:${f.sizeBytes}:${new Date(f.lastModified).getTime()}`,
  );
  return simpleHash(parts.join("|"));
};
