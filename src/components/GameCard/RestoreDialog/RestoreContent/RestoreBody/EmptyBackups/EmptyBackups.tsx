import { useTranslation } from "react-i18next";

export const EmptyBackups = () => {
  const { t } = useTranslation();

  return (
    <p className="text-sm text-muted-foreground py-4 text-center">
      {t("restore.noBackups")}
    </p>
  );
};
