import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { requireAdmin, SETTINGS_ROLES } from "@/features/auth/dal";
import { parseSeasonal } from "@/features/seasonal/config";
import { SeasonalForm } from "@/features/seasonal/components/seasonal-form";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Seasonal" };

export default function SeasonalPage() {
  return (
    <>
      <PageHeader title="Seasonal" description="Snow, lights and a festive banner for Christmas and other holidays. Schedule it once and it switches itself off." />
      <Suspense fallback={<PanelSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireAdmin(SETTINGS_ROLES);
  const row = await getPrisma().businessSetting.findUnique({ where: { id: 1 }, select: { seasonal: true } });
  return <SeasonalForm initial={parseSeasonal(row?.seasonal)} />;
}
