import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, setupUser } from "@/test/test-utils";
import { DeleteBackupDialog } from "./DeleteBackupDialog";
import { Button } from "@/components/ui/button";

vi.mock("./DeleteBackupContent/DeleteBackupContent", () => ({
  DeleteBackupContent: () => <div data-testid="delete-backup-content" />,
}));

const renderDialog = () =>
  renderWithProviders(
    <DeleteBackupDialog
      onConfirm={vi.fn()}
      trigger={<Button>Delete</Button>}
    />,
  );

describe("DeleteBackupDialog", () => {
  const user = setupUser();

  it("does not show content initially", () => {
    renderDialog();
    expect(
      screen.queryByTestId("delete-backup-content"),
    ).not.toBeInTheDocument();
  });

  it("shows content when trigger is clicked", async () => {
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByTestId("delete-backup-content")).toBeInTheDocument();
  });
});
