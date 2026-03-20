import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, setupUser } from "@/test/test-utils";
import { mockBackups } from "@/test/mocks/drive";
import { BackupList } from "./BackupList";

vi.mock("@/components/GameCard/DeleteBackupDialog/DeleteBackupDialog", () => ({
  DeleteBackupDialog: ({
    onConfirm,
  }: {
    trigger: React.ReactElement;
    onConfirm: () => void;
  }) => (
    <button type="button" onClick={onConfirm} aria-label="restore.delete">
      delete
    </button>
  ),
}));

const renderList = (
  props: Partial<React.ComponentProps<typeof BackupList>> = {},
) =>
  renderWithProviders(
    <BackupList
      backups={mockBackups}
      onSelect={vi.fn()}
      onDelete={vi.fn()}
      {...props}
    />,
  );

describe("BackupList", () => {
  const user = setupUser();

  it("renders a row for each backup", () => {
    renderList();
    expect(screen.getAllByRole("listitem")).toHaveLength(mockBackups.length);
  });

  it("calls onSelect when a backup row is clicked", async () => {
    const onSelect = vi.fn();
    renderList({ onSelect });

    const rows = screen.getAllByRole("listitem");
    await user.click(rows[0].querySelector("button")!);

    expect(onSelect).toHaveBeenCalledWith(mockBackups[0]);
  });

  it("highlights the selected backup", () => {
    renderList({ selected: mockBackups[0] });

    const firstRow = screen.getAllByRole("listitem")[0];
    const selectButton = firstRow.querySelector("button")!;
    expect(selectButton.className).toContain("bg-primary/10");
  });

  it("shows warning text when a backup is selected", () => {
    renderList({ selected: mockBackups[0] });
    expect(screen.getByText("restore.warning")).toBeInTheDocument();
  });

  it("does not show warning text when nothing is selected", () => {
    renderList();
    expect(screen.queryByText("restore.warning")).not.toBeInTheDocument();
  });

  it("calls onDelete with the correct backup id", async () => {
    const onDelete = vi.fn();
    renderList({ onDelete });

    const deleteButtons = screen.getAllByLabelText("restore.delete");
    await user.click(deleteButtons[1]);

    expect(onDelete).toHaveBeenCalledWith(mockBackups[1].id);
  });

  it("renders a delete button for each backup", () => {
    renderList();
    expect(screen.getAllByLabelText("restore.delete")).toHaveLength(
      mockBackups.length,
    );
  });
});
