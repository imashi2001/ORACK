"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cta } from "@/components/shop/cta";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-ink px-6 py-24 text-center text-white">
      <span className="eyebrow text-[#a3a3a3]">Something went wrong</span>
      <h1 className="display text-[clamp(56px,9vw,120px)]">Hold up.</h1>
      <p className="max-w-md text-[#c9c9c9]">We hit a problem loading this page. Please try again. If it keeps happening, message us on WhatsApp.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={cta({ tone: "light" })}>
          Try again
        </button>
        <Link href="/" className={cta({ tone: "outline-light" })}>
          Back to the store
        </Link>
      </div>
    </main>
  );
}
