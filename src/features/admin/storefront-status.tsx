import Link from "next/link";
import { ArrowRightIcon, FolderTreeIcon, ImageIcon, SnowflakeIcon, TagIcon } from "lucide-react";
import { Card } from "@/features/admin/components/ui";
import { isSeasonLive, parseSeasonal, PRESET_INFO, sriLankaToday } from "@/features/seasonal/config";
import { getPrisma } from "@/lib/prisma";

/** At-a-glance view of what customers currently see, with shortcuts to change it. */
export async function StorefrontStatus() {
  const prisma = getPrisma();
  const [categories, discounted, heroCount, imageCount, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { name: true, isActive: true } }),
    prisma.product.count({ where: { status: "ACTIVE", discountPercent: { not: null } } }),
    prisma.heroSlide.count({ where: { isActive: true } }),
    prisma.siteImage.count(),
    prisma.businessSetting.findUnique({ where: { id: 1 }, select: { seasonal: true } }),
  ]);
  const seasonal = parseSeasonal(settings?.seasonal);
  const live = isSeasonLive(seasonal, sriLankaToday());
  const shown = categories.filter((c) => c.isActive).map((c) => c.name);
  const hidden = categories.filter((c) => !c.isActive).map((c) => c.name);

  const rows = [
    { icon: FolderTreeIcon, label: "Categories on sale", value: shown.join(", ") || "None", note: hidden.length ? `Paused: ${hidden.join(", ")}` : "Nothing paused", href: "/admin/categories" },
    { icon: TagIcon, label: "Discounts", value: discounted ? `${discounted} product${discounted === 1 ? "" : "s"} on sale` : "No discounts", note: "Set a % off on any product", href: "/admin/products" },
    {
      icon: SnowflakeIcon,
      label: "Seasonal",
      value: live ? `${PRESET_INFO[seasonal.preset].emoji} ${PRESET_INFO[seasonal.preset].label} is live` : seasonal.enabled ? "Scheduled" : "Off",
      note: seasonal.endsOn && seasonal.enabled ? `Until ${seasonal.endsOn}` : "Snow, lights and banner",
      href: "/admin/seasonal",
    },
    { icon: ImageIcon, label: "Homepage photos", value: `${heroCount} hero · ${imageCount} section`, note: "Replace any photo", href: "/admin/homepage" },
  ];

  return (
    <Card title="Storefront controls" description="What customers see right now.">
      <ul className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ icon: Icon, label, value, note, href }) => (
          <li key={label} className="bg-white">
            <Link href={href} className="group flex h-full flex-col gap-2 p-4 hover:bg-paper">
              <span className="flex items-center justify-between text-xs font-semibold tracking-wide text-smoke uppercase">
                <span className="flex items-center gap-2">
                  <Icon className="size-4" aria-hidden="true" /> {label}
                </span>
                <ArrowRightIcon className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold">{value}</span>
              <span className="text-xs text-smoke">{note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
