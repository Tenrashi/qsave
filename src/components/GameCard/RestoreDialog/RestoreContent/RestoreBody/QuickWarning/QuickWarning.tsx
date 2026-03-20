import { useTranslation } from "react-i18next";

export const QuickWarning = () => {
  const { t } = useTranslation();

  return (
    <p className="text-sm text-amber-600 dark:text-amber-400">
      {t("restore.warning")}
    </p>
  );
};
