import { describe, it, expect } from "vitest";
import { formatSize } from "./formatSize";

describe("formatSize", () => {
  it("formats bytes", () => {
    expect(formatSize(0)).toBe("0 B");
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatSize(1024)).toBe("1 KB");
    expect(formatSize(1536)).toBe("2 KB");
    expect(formatSize(1024 * 999)).toBe("999 KB");
  });

  it("formats megabytes", () => {
    expect(formatSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatSize(1024 * 1024 * 25.3)).toBe("25.3 MB");
    expect(formatSize(1024 * 1024 * 100)).toBe("100.0 MB");
  });
});
