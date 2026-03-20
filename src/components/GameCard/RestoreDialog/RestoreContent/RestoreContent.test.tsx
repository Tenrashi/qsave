import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { Dialog } from "@/components/ui/dialog";
import { sims4Game } from "@/test/mocks/games";
import { RestoreContent } from "./RestoreContent";

vi.mock("./RestoreBody/RestoreBody", () => ({
  RestoreBody: () => <div data-testid="restore-body" />,
}));

const renderContent = (props: { quick?: boolean } = {}) =>
  renderWithProviders(
    <Dialog open={true}>
      <RestoreContent game={sims4Game} open={true} {...props} />
    </Dialog>,
  );

describe("RestoreContent", () => {
  it("shows game name in title for list mode", () => {
    renderContent();
    expect(screen.getByText("restore.title")).toBeInTheDocument();
  });

  it("shows confirm title in quick mode", () => {
    renderContent({ quick: true });
    expect(screen.getByText("restore.confirmTitle")).toBeInTheDocument();
  });

  it("shows select backup description in list mode", () => {
    renderContent();
    expect(screen.getByText("restore.selectBackup")).toBeInTheDocument();
  });

  it("does not show description in quick mode", () => {
    renderContent({ quick: true });
    expect(screen.queryByText("restore.selectBackup")).not.toBeInTheDocument();
  });

  it("renders restore body", () => {
    renderContent();
    expect(screen.getByTestId("restore-body")).toBeInTheDocument();
  });
});
