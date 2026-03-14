import { useTranslation } from "react-i18next";
import { LogIn, LogOut, Cloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth";

export const AuthStatus = () => {
  const { t } = useTranslation();
  const { auth, loading, login, logout } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        <span className="text-sm text-muted-foreground">{t("auth.connecting")}</span>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("auth.notConnected")}</span>
        </div>
        <Button size="sm" onClick={login}>
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          {t("auth.connect")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-green-500" />
        <span className="text-sm text-muted-foreground">{t("auth.driveLabel")}</span>
        <Badge variant="secondary">{auth.email}</Badge>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="w-3.5 h-3.5 mr-1.5" />
        {t("auth.disconnect")}
      </Button>
    </div>
  );
};
