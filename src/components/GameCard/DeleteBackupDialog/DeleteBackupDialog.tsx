import { useState } from "react";
import { Dialog, DialogTrigger, DialogPopup } from "@/components/ui/dialog";
import { DeleteBackupContent } from "./DeleteBackupContent/DeleteBackupContent";

export type DeleteBackupDialogProps = {
  trigger: React.ReactElement;
  onConfirm: () => void;
};

export const DeleteBackupDialog = ({
  trigger,
  onConfirm,
}: DeleteBackupDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogPopup className="max-w-sm">
        <DeleteBackupContent onConfirm={handleConfirm} />
      </DialogPopup>
    </Dialog>
  );
};
