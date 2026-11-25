import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { requireAdmin, SETTINGS_ROLES } from "@/features/auth/dal";
import { SettingsForm } from "@/features/settings/settings-form";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Business details used across the store and in WhatsApp links." />
      <Suspense fallback={<PanelSkeleton />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  await requireAdmin(SETTINGS_ROLES);
  const s = await getPrisma().businessSetting.findUnique({ where: { id: 1 } });
  return (
    <SettingsForm
      initial={{
        businessName: s?.businessName ?? "ORACK",
        whatsappNumber: s?.whatsappNumber ?? "",
        contactEmail: s?.contactEmail ?? "",
        contactPhone: s?.contactPhone ?? "",
        address: s?.address ?? "",
        instagramUrl: s?.instagramUrl ?? "",
        facebookUrl: s?.facebookUrl ?? "",
        tiktokUrl: s?.tiktokUrl ?? "",
        deliveryInfo: s?.deliveryInfo ?? "",
        announcementText: s?.announcementText ?? "",
        announcementEnabled: s?.announcementEnabled ?? false,
      }}
    />
  );
}
