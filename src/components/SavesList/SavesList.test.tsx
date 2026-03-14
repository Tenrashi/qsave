import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { twoGames } from "@/test/mocks/games";
import { SavesList, type SavesListProps } from "./SavesList";

const defaultProps: SavesListProps = {
  games: [],
};

const renderSavesList = (overrides: Partial<SavesListProps> = {}) => {
  return renderWithProviders(<SavesList {...defaultProps} {...overrides} />);
};

describe("SavesList", () => {
  it("shows empty state when no games", () => {
    renderSavesList();
    expect(screen.getByText("No games detected")).toBeInTheDocument();
  });

  it("renders game cards for detected games", () => {
    renderSavesList({ games: twoGames });
    expect(screen.getByText("The Sims 4")).toBeInTheDocument();
    expect(screen.getByText("Cyberpunk 2077")).toBeInTheDocument();
  });
});
