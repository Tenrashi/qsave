import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type DeleteBackupContentProps = {
  onConfirm: () => void;
};

export const DeleteBackupContent = ({
  onConfirm,
}: DeleteBackupContentProps) => {
  const { t } = useTranslation();

  return (
    <>
      <DialogTitle className="mb-1">{t("restore.deleteTitle")}</DialogTitle>
      <DialogDescription className="mb-4">
        {t("restore.deleteDescription")}
      </DialogDescription>

      <div className="flex justify-end gap-2">
        <DialogClose render={<Button variant="ghost" />}>
          {t("games.cancel")}
        </DialogClose>
        <Button variant="destructive" onClick={onConfirm}>
          {t("restore.delete")}
        </Button>
      </div>
    </>
  );
};
