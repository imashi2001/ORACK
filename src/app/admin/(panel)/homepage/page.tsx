import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { adminButton, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { requireAdmin, SETTINGS_ROLES } from "@/features/auth/dal";
import { HeroManager } from "@/features/hero/components/hero-manager";
import { getAllHeroSlidesForAdmin } from "@/features/hero/queries";
import { isR2Configured } from "@/lib/r2";

export const metadata: Metadata = { title: "Homepage" };

export default function HomepageAdminPage() {
  return (
    <>
      <PageHeader
        title="Homepage"
        description="Hero images shown at the top of the store."
        actions={
          <Link href="/" target="_blank" className={adminButton({ variant: "secondary", size: "sm" })}>
            <ExternalLinkIcon /> View store
          </Link>
        }
      />
      <Suspense fallback={<PanelSkeleton />}>
        <Hero />
      </Suspense>
    </>
  );
}

async function Hero() {
  await requireAdmin(SETTINGS_ROLES);
  const slides = await getAllHeroSlidesForAdmin();
  return <HeroManager slides={slides} storageReady={isR2Configured("public")} />;
}
