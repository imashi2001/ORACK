import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { adminButton, Card, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { requireAdmin, SETTINGS_ROLES } from "@/features/auth/dal";
import { HeroManager } from "@/features/hero/components/hero-manager";
import { getAllHeroSlidesForAdmin } from "@/features/hero/queries";
import { ImageSlot } from "@/features/site-images/components/image-slot";
import { categorySlot, SITE_IMAGE_SLOTS, type FixedSlot } from "@/features/site-images/slots";
import { getPrisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";

export const metadata: Metadata = { title: "Homepage" };

export default function HomepageAdminPage() {
  return (
    <>
      <PageHeader
        title="Homepage"
        description="Every photo on the homepage. Anything without a photo uses ORACK's built-in artwork."
        actions={
          <Link href="/" target="_blank" className={adminButton({ variant: "secondary", size: "sm" })}>
            <ExternalLinkIcon /> View store
          </Link>
        }
      />
      <Suspense fallback={<PanelSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireAdmin(SETTINGS_ROLES);
  const prisma = getPrisma();
  const [slides, images, categories] = await Promise.all([
    getAllHeroSlidesForAdmin(),
    prisma.siteImage.findMany(),
    prisma.category.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } }),
  ]);
  const storageReady = isR2Configured("public");
  const bySlot = new Map(images.map((i) => [i.slot, { url: i.url, alt: i.altText }]));

  return (
    <>
      <HeroManager slides={slides} storageReady={storageReady} />

      <Card
        title="Shop cards"
        description="The cards under the hero: one per visible category, plus Custom designs. Hidden categories don't show a card. Change names and short descriptions in Categories."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {categories.map((c) => (
            <ImageSlot
              key={c.id}
              slot={categorySlot(c.id)}
              label={`${c.name} card`}
              badge={c.isActive ? undefined : "Hidden category"}
              image={bySlot.get(categorySlot(c.id)) ?? null}
              storageReady={storageReady}
              aspect="aspect-[4/5]"
            />
          ))}
          <SlotFor slot="home.custom-tile" bySlot={bySlot} storageReady={storageReady} aspect="aspect-[4/5]" />
        </div>
      </Card>

      <Card title="Section images" description="Large photos further down the homepage and on the About page.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          <SlotFor slot="home.customize-band" bySlot={bySlot} storageReady={storageReady} aspect="aspect-square" />
          <SlotFor slot="home.story" bySlot={bySlot} storageReady={storageReady} aspect="aspect-[5/4]" />
        </div>
      </Card>
    </>
  );
}

function SlotFor({ slot, bySlot, storageReady, aspect }: { slot: FixedSlot; bySlot: Map<string, { url: string; alt: string }>; storageReady: boolean; aspect: string }) {
  const meta = SITE_IMAGE_SLOTS[slot];
  return <ImageSlot slot={slot} label={meta.label} hint={meta.hint} image={bySlot.get(slot) ?? null} storageReady={storageReady} aspect={aspect} />;
}
