import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "@/stores/auth";
import { sims4Game, eldenRingGame } from "@/test/mocks/games";
import { GameCard, type GameCardProps } from "./GameCard";

vi.mock("./utils/formatSize", () => ({
  formatSize: (bytes: number) => `${bytes} bytes`,
}));

const defaultProps: GameCardProps = {
  game: sims4Game,
};

const renderGameCard = (overrides: Partial<GameCardProps> = {}) => {
  return renderWithProviders(<GameCard {...defaultProps} {...overrides} />);
};

describe("GameCard", () => {
  beforeEach(() => {
    useAuthStore.setState({ auth: { isAuthenticated: false }, loading: false });
  });

  it("renders game name and save count", () => {
    renderGameCard();
    expect(screen.getByText("The Sims 4")).toBeInTheDocument();
    expect(screen.getByText("2 saves")).toBeInTheDocument();
  });

  it("does not show sync buttons when not authenticated", () => {
    renderGameCard();
    expect(screen.queryByText("Sync All")).not.toBeInTheDocument();
  });

  it("shows sync buttons when authenticated", () => {
    useAuthStore.setState({
      auth: { isAuthenticated: true, email: "test@gmail.com" },
      loading: false,
    });
    renderGameCard();
    expect(screen.getByText("Sync All")).toBeInTheDocument();
  });

  it("renders with custom game", () => {
    renderGameCard({ game: eldenRingGame });
    expect(screen.getByText("Elden Ring")).toBeInTheDocument();
    expect(screen.getByText("1 save")).toBeInTheDocument();
  });

  it("shows file names and formatted sizes when expanded", async () => {
    const user = userEvent.setup();
    renderGameCard();

    await user.click(screen.getByText("The Sims 4"));

    expect(screen.getByText("Slot_001.save")).toBeInTheDocument();
    expect(screen.getByText("Slot_002.save")).toBeInTheDocument();
    expect(screen.getByText("12582912 bytes")).toBeInTheDocument();
    expect(screen.getByText("8388608 bytes")).toBeInTheDocument();
  });
});
