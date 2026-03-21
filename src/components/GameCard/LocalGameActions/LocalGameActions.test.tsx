import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, setupUser } from "@/test/test-utils";
import { useAuthStore } from "@/stores/auth";
import { useSyncStore } from "@/stores/sync";
import { SYNC_STATUS } from "@/domain/types";
import { sims4Game, manualGame } from "@/test/mocks/games";
import {
  LocalGameActions,
  type LocalGameActionsProps,
} from "./LocalGameActions";

vi.mock("../utils/formatSize", () => ({
  formatSize: (bytes: number) => `${bytes} bytes`,
}));

const defaultProps: LocalGameActionsProps = {
  game: sims4Game,
  onRemove: vi.fn(),
  onSync: vi.fn(),
};

const renderActions = (overrides: Partial<LocalGameActionsProps> = {}) =>
  renderWithProviders(<LocalGameActions {...defaultProps} {...overrides} />);

const authenticateUser = () => {
  useAuthStore.setState({
    auth: { isAuthenticated: true, email: "test@gmail.com" },
    loading: false,
  });
};

describe("LocalGameActions", () => {
  const user = setupUser();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ auth: { isAuthenticated: false }, loading: false });
    useSyncStore.setState({
      gameStatuses: {},
      watchedGames: {},
      syncFingerprints: {},
      backedUpGames: new Set<string>(),
      backedUpGamesLoaded: false,
    });
  });

  it("renders file size", () => {
    renderActions();
    expect(screen.getByText("20971520 bytes")).toBeInTheDocument();
  });

  it("renders last modified date when save files exist", () => {
    renderActions();
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it("does not show sync button when not authenticated", () => {
    renderActions();
    expect(screen.queryByText("games.sync")).not.toBeInTheDocument();
  });

  it("shows sync button when authenticated", () => {
    authenticateUser();
    renderActions();
    expect(screen.getByText("games.sync")).toBeInTheDocument();
  });

  it("calls onSync when sync button is clicked", async () => {
    authenticateUser();
    const onSync = vi.fn();
    renderActions({ onSync });
    await user.click(screen.getByText("games.sync"));
    expect(onSync).toHaveBeenCalledOnce();
  });

  it("shows watch toggle when authenticated", () => {
    authenticateUser();
    renderActions();
    expect(
      screen.getByRole("button", {
        name: /games\.watchTooltip|games\.unwatchTooltip/,
      }),
    ).toBeInTheDocument();
  });

  it("shows remove button for manual games", () => {
    renderActions({ game: manualGame });
    expect(
      screen.getByRole("button", { name: "games.removeGame" }),
    ).toBeInTheDocument();
  });

  it("does not show remove button for auto-detected games", () => {
    renderActions();
    expect(
      screen.queryByRole("button", { name: "games.removeGame" }),
    ).not.toBeInTheDocument();
  });

  it("shows restore buttons when game has backup", () => {
    authenticateUser();
    useSyncStore.setState({
      backedUpGames: new Set(["The Sims 4"]),
      backedUpGamesLoaded: true,
    });
    renderActions();
    expect(
      screen.getByRole("button", { name: "restore.tooltip" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "restore.tooltipPick" }),
    ).toBeInTheDocument();
  });

  it("does not show restore buttons when game has no backup", () => {
    authenticateUser();
    renderActions();
    expect(
      screen.queryByRole("button", { name: "restore.tooltip" }),
    ).not.toBeInTheDocument();
  });

  it("disables sync and restore buttons when busy", () => {
    authenticateUser();
    useSyncStore.setState({
      gameStatuses: { "The Sims 4": SYNC_STATUS.syncing },
      backedUpGames: new Set(["The Sims 4"]),
      backedUpGamesLoaded: true,
    });
    renderActions();
    expect(screen.getByText("games.sync").closest("button")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "restore.tooltip" }),
    ).toBeDisabled();
  });
});
