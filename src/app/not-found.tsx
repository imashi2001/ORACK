import Link from "next/link";
import { cta } from "@/components/shop/cta";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-ink px-6 py-24 text-center text-white">
      <span className="eyebrow text-[#a3a3a3]">404</span>
      <h1 className="display text-[clamp(64px,10vw,140px)]">Lost the drop.</h1>
      <p className="max-w-md text-[#c9c9c9]">We couldn&apos;t find that page. It may have moved or sold out.</p>
      <Link href="/" className={cta({ tone: "light" })}>
        Back to ORACK.
      </Link>
    </main>
  );
}
