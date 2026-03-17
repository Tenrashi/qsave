import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameBanner } from "./GameBanner";

describe("GameBanner", () => {
  it("renders Steam header image when steamId is provided", () => {
    render(<GameBanner steamId={1222670} />);
    const img = screen.getByRole("img", { name: /steam game banner/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1222670/header.jpg",
    );
  });

  it("renders gamepad icon when no steamId", () => {
    render(<GameBanner />);
    expect(screen.queryByRole("img", { name: /steam game banner/i })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /gamepad/i })).toBeInTheDocument();
  });

  it("falls back to gamepad icon on image error", () => {
    render(<GameBanner steamId={1222670} />);
    fireEvent.error(screen.getByRole("img", { name: /steam game banner/i }));
    expect(screen.queryByRole("img", { name: /steam game banner/i })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /gamepad/i })).toBeInTheDocument();
  });
});
