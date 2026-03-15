import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameBanner } from "./GameBanner";

describe("GameBanner", () => {
  it("renders Steam header image when steamId is provided", () => {
    const { container } = render(<GameBanner steamId={1222670} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1222670/header.jpg",
    );
  });

  it("renders gamepad icon when no steamId", () => {
    const { container } = render(<GameBanner />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("falls back to gamepad icon on image error", () => {
    const { container } = render(<GameBanner steamId={1222670} />);
    const img = container.querySelector("img")!;
    fireEvent.error(img);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders gradient overlay on the image", () => {
    const { container } = render(<GameBanner steamId={1222670} />);
    const overlay = container.querySelector("[style]");
    expect(overlay).toBeInTheDocument();
    expect(overlay?.getAttribute("style")).toContain("linear-gradient");
  });
});
