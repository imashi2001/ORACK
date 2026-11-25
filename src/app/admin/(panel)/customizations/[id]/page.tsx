import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DownloadIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/shop/icons";
import { adminButton, Badge, Card, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { ConvertPanel, QuotationsPanel, RequestNotesControl, RequestStatusControl } from "@/features/admin/customizations/components";
import { getCustomizationDetail } from "@/features/admin/customizations/queries";
import { customizationStatusMeta, formatDateTime } from "@/features/admin/labels";
import { requireAdmin } from "@/features/auth/dal";
import { PLACEMENTS } from "@/features/customization/schemas";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Custom request" };

export default function CustomizationPage({ params }: PageProps<"/admin/customizations/[id]">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Request params={params} />
    </Suspense>
  );
}

async function Request({ params }: Pick<PageProps<"/admin/customizations/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const r = await getCustomizationDetail(id);
  if (!r) notFound();
  const s = customizationStatusMeta(r.status);
  const closed = r.status === "CONVERTED_TO_ORDER" || r.status === "COMPLETED";
  const contactUrl = buildWhatsAppUrl(`Hi ${r.customerName.split(" ")[0]}, this is ORACK about your custom request ${r.reference}.`, r.customerPhone);
  const placements = r.placements.map((v) => PLACEMENTS.find((p) => p.value === v)?.label ?? v).join(", ");
  const uploaded = r.images.filter((i) => i.status === "UPLOADED");
  const missing = r.images.filter((i) => i.status !== "UPLOADED");

  return (
    <>
      <PageHeader
        title={r.reference}
        back={{ href: "/admin/customizations", label: "Custom requests" }}
        description={`Received ${formatDateTime(r.createdAt)}`}
        actions={
          <>
            <Badge tone={s.tone}>{s.label}</Badge>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className={adminButton({ size: "sm" })}>
              <WhatsAppIcon /> Message customer
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Request">
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Item label="Customer" value={r.customerName} />
              <div>
                <dt className="eyebrow text-smoke">WhatsApp</dt>
                <dd className="mt-1">
                  <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                    {r.customerPhone}
                  </a>
                </dd>
              </div>
              <Item label="Product" value={`${r.productNameSnapshot}${r.product ? "" : " (no longer in catalogue)"}`} />
              <Item label="Colour / size / quantity" value={`${r.colorName} / ${r.size} × ${r.quantity}`} />
              <Item label="Placement" value={placements} />
              <div className="sm:col-span-2">
                <dt className="eyebrow text-smoke">Design description</dt>
                <dd className="mt-1 whitespace-pre-line">{r.designDescription}</dd>
              </div>
              {r.additionalInstructions && (
                <div className="sm:col-span-2">
                  <dt className="eyebrow text-smoke">Additional instructions</dt>
                  <dd className="mt-1 whitespace-pre-line">{r.additionalInstructions}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Reference images" description="Private. Links expire after 5 minutes; reload the page for fresh ones.">
            {r.images.length === 0 ? (
              <p className="text-sm text-smoke">No images were attached. The customer may send them on WhatsApp.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {uploaded.length > 0 && (
                  <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                    {uploaded.map((img) => (
                      <li key={img.id} className="flex flex-col gap-2 border border-line p-2">
                        {img.url ? (
                          <a href={img.url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-mist">
                            {/* Signed, short-lived private URL: next/image would cache it, so a plain img is used. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={`Reference image ${img.fileName}`} className="size-full object-contain" />
                          </a>
                        ) : (
                          <div className="flex aspect-square items-center justify-center bg-mist text-xs text-smoke">Storage not configured</div>
                        )}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate" title={img.fileName}>
                            {img.fileName}
                          </span>
                          {img.url && (
                            <a href={img.url} download={img.fileName} aria-label={`Download ${img.fileName}`} className="p-1">
                              <DownloadIcon className="size-4" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {missing.length > 0 && (
                  <p className="text-sm text-[#8a5300]">
                    {missing.length} image(s) didn&apos;t arrive ({missing.map((m) => m.fileName).join(", ")}). Ask the customer to send them on WhatsApp.
                  </p>
                )}
              </div>
            )}
          </Card>

          <QuotationsPanel
            request={{
              id: r.id,
              reference: r.reference,
              customerName: r.customerName,
              customerPhone: r.customerPhone,
              productName: r.productNameSnapshot,
              colorName: r.colorName,
              size: r.size,
              quantity: r.quantity,
              closed,
            }}
            quotations={r.quotations}
          />
        </div>

        <div className="flex flex-col gap-6">
          <ConvertPanel requestId={r.id} order={r.order} canConvert={r.status === "ACCEPTED" && r.quotations.some((q) => q.status === "ACCEPTED")} />
          <RequestStatusControl requestId={r.id} status={r.status} />
          <RequestNotesControl requestId={r.id} notes={r.adminNotes} />
        </div>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-smoke">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
