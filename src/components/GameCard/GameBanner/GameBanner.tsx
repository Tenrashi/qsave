import { memo, useState } from "react";
import { Gamepad2 } from "lucide-react";

const steamHeaderUrl = (steamId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/header.jpg`;

export type GameBannerProps = {
  steamId?: number;
};

export const GameBanner = memo(({ steamId }: GameBannerProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (!steamId || imgFailed) {
    return (
      <div className="pl-4">
        <Gamepad2 className="w-4 h-4 text-muted-foreground" role="img" aria-label="gamepad" aria-hidden={false} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-32 shrink-0">
      <img
        src={steamHeaderUrl(steamId)}
        alt="Steam game banner"
        className="h-full w-full object-cover"
        onError={() => setImgFailed(true)}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, transparent 50%, var(--color-card) 100%)",
        }}
      />
    </div>
  );
});
