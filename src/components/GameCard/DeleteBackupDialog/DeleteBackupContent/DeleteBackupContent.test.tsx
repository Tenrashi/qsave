import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, setupUser } from "@/test/test-utils";
import { Dialog } from "@/components/ui/dialog";
import { DeleteBackupContent } from "./DeleteBackupContent";

const renderContent = (onConfirm = vi.fn()) =>
  renderWithProviders(
    <Dialog open={true}>
      <DeleteBackupContent onConfirm={onConfirm} />
    </Dialog>,
  );

describe("DeleteBackupContent", () => {
  const user = setupUser();

  it("renders title and description", () => {
    renderContent();
    expect(screen.getByText("restore.deleteTitle")).toBeInTheDocument();
    expect(screen.getByText("restore.deleteDescription")).toBeInTheDocument();
  });

  it("calls onConfirm when delete button is clicked", async () => {
    const onConfirm = vi.fn();
    renderContent(onConfirm);

    await user.click(screen.getByRole("button", { name: "restore.delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("renders cancel button", () => {
    renderContent();
    expect(
      screen.getByRole("button", { name: "games.cancel" }),
    ).toBeInTheDocument();
  });
});
