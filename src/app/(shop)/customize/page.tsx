import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/shop/container";
import { CustomizeForm } from "@/features/customization/components/customize-form";
import { getCustomizableProducts } from "@/features/products/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/customize" },
  title: "Custom designs",
  description: "Request a custom ORACK T-shirt or hoodie. Upload your design and get a quote on WhatsApp.",
};

export default function CustomizePage({ searchParams }: PageProps<"/customize">) {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div aria-hidden="true" className="display text-outline pointer-events-none absolute -top-[2vw] -right-[2vw] text-[clamp(140px,22vw,320px)] whitespace-nowrap">
          Studio
        </div>
        <Container className="relative flex flex-col gap-4.5 py-[clamp(48px,6vw,80px)]">
          <span className="eyebrow text-xs text-[#a3a3a3]">Custom studio</span>
          <h1 className="display text-[clamp(60px,9vw,132px)]">Make it yours.</h1>
          <p className="max-w-[620px] text-lg leading-relaxed text-[#c9c9c9]">
            Tell us what you have in mind. We&apos;ll review your request and send a quotation on WhatsApp. This is a request, not an order: nothing is printed or charged until you accept the quote.
          </p>
        </Container>
      </section>
      <Container className="pt-12 pb-24">
        <Suspense fallback={<div className="aspect-[16/9] bg-mist" aria-hidden="true" />}>
          <CustomizeContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

async function CustomizeContent({ searchParams }: Pick<PageProps<"/customize">, "searchParams">) {
  const [{ product }, products] = await Promise.all([searchParams, getCustomizableProducts()]);
  return <CustomizeForm products={products} initialSlug={typeof product === "string" ? product : undefined} />;
}
