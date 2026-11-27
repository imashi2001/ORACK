import type { Metadata } from "next";
import { PageBody, PageHero, Section } from "@/components/shop/info-page";
import { getPublicSettings } from "@/features/settings/queries";
import { MEASURE_TIPS, SizeChart } from "@/features/settings/size-chart";
import { hasMeasurements, SIZE_GUIDE_KINDS } from "@/features/settings/size-guide";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  alternates: { canonical: "/size-guide" },
  title: "Size guide",
  description: "ORACK T-shirt and hoodie measurements, how to measure, and how our oversized fits are meant to sit.",
};

export default async function SizeGuidePage() {
  const settings = await getPublicSettings();
  const charts = SIZE_GUIDE_KINDS.filter(({ kind }) => hasMeasurements(settings.sizeGuide[kind]));
  const askUrl = buildWhatsAppUrl("Hi ORACK! Can you help me choose a size?", settings.whatsappNumber);

  return (
    <>
      <PageHero crumb="Size guide" eyebrow="Fit & sizing" ghost="FIT" title="Size guide" intro="Our pieces are cut oversized and relaxed. Use the measurements below to find the fit you want." />
      <PageBody
        toc={[
          ...(charts.length ? [{ id: "measurements", label: "Measurements" }] : []),
          { id: "fit", label: "How it fits" },
          { id: "measure", label: "How to measure" },
        ]}
      >
        {charts.length > 0 && (
          <Section id="measurements" title="Measurements">
            <p>Garment measurements in centimetres, measured flat. Allow ±1–2 cm.</p>
            <div className="mt-2 flex flex-col gap-8">
              {charts.map(({ kind, label }) => (
                <div key={kind} className="flex flex-col gap-2">
                  <h3 className="text-base font-bold text-ink">{label}</h3>
                  <SizeChart rows={settings.sizeGuide[kind]} className="border border-line bg-white p-4" />
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section id="fit" title="How it fits">
          <ul>
            <li>
              <strong>Want the oversized look?</strong> Take your usual size. Shoulders drop and the body sits loose and boxy.
            </li>
            <li>
              <strong>Prefer it closer?</strong> Go one size down.
            </li>
            <li>
              <strong>Between sizes?</strong> Size up for hoodies you&apos;ll layer, size down for tees you&apos;ll tuck.
            </li>
          </ul>
          <p>
            Still unsure?{" "}
            <a href={askUrl} target="_blank" rel="noopener noreferrer">
              Tell us your height and usual size on WhatsApp
            </a>{" "}
            and we&apos;ll recommend one.
          </p>
        </Section>

        <Section id="measure" title="How to measure">
          <p>The easiest way: take a tee or hoodie you love the fit of, lay it flat and compare.</p>
          <ol className="mt-2 grid gap-px bg-line sm:grid-cols-3">
            {MEASURE_TIPS.map((t, i) => (
              <li key={t.title} className="flex flex-col gap-2 bg-white p-5">
                <span className="eyebrow text-smoke">0{i + 1}</span>
                <span className="font-bold text-ink">{t.title}</span>
                <span className="text-[15px] leading-relaxed">{t.body}</span>
              </li>
            ))}
          </ol>
        </Section>
      </PageBody>
    </>
  );
}
