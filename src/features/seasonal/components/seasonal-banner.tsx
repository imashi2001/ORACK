import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { PRESET_INFO, type SeasonalSettings } from "../config";

/** Festive message strip above the announcement bar while a season is live. */
export function SeasonalBanner({ settings }: { settings: SeasonalSettings }) {
  const emoji = PRESET_INFO[settings.preset].emoji;
  const content = (
    <>
      <span aria-hidden="true">{emoji}</span>
      <span>{settings.bannerText}</span>
      {settings.bannerLink && <ArrowRightIcon aria-hidden="true" className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </>
  );
  const cls = "group flex items-center justify-center gap-2.5 px-4 py-2.5 text-center text-[13px] font-semibold";
  return (
    <div className="relative border-b border-white/10 bg-[linear-gradient(90deg,#0a0a0a,#1c1c1c_50%,#0a0a0a)] text-white">
      {settings.bannerLink ? (
        <Link href={settings.bannerLink} className={cls}>
          {content}
        </Link>
      ) : (
        <p className={cls}>{content}</p>
      )}
    </div>
  );
}
