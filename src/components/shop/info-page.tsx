import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Container } from "@/components/shop/container";
import { cn } from "@/lib/utils";

/** Dark title band used by About, Help and the policy pages. */
export function PageHero({ eyebrow, title, intro, ghost, crumb }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode; ghost?: string; crumb: string }) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {ghost && (
        <div aria-hidden="true" className="display text-outline pointer-events-none absolute -top-[2vw] -right-[2vw] text-[clamp(120px,20vw,300px)] whitespace-nowrap select-none">
          {ghost}
        </div>
      )}
      <Container className="relative flex flex-col gap-4 py-[clamp(40px,6vw,80px)]">
        <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-1.5 text-white/50">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <ChevronRightIcon aria-hidden="true" className="size-3" />
          <span aria-current="page" className="text-white/80">
            {crumb}
          </span>
        </nav>
        <span className="eyebrow mt-2 text-xs text-[#a3a3a3]">{eyebrow}</span>
        <h1 className="display text-[clamp(52px,8vw,120px)]">{title}</h1>
        {intro && <p className="max-w-[640px] text-lg leading-relaxed text-[#c9c9c9]">{intro}</p>}
      </Container>
    </section>
  );
}

/** Two-column body: a sticky "on this page" list beside the content on wide screens. */
export function PageBody({ toc, children, updated }: { toc?: { id: string; label: string }[]; children: React.ReactNode; updated?: string }) {
  return (
    <Container className="grid gap-10 py-[clamp(40px,6vw,88px)] lg:grid-cols-[220px_minmax(0,720px)] lg:gap-20">
      {toc ? (
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-1 border-l-2 border-ink pl-5">
            <span className="eyebrow mb-2 text-smoke">On this page</span>
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="py-1 text-sm text-graphite hover:text-ink hover:underline">
                {t.label}
              </a>
            ))}
          </div>
        </nav>
      ) : (
        <div className="hidden lg:block" />
      )}
      <div className="flex flex-col gap-12">
        {children}
        {updated && <p className="eyebrow border-t border-line pt-6 text-smoke">Last updated {updated}</p>}
      </div>
    </Container>
  );
}

/** A titled block of readable copy. */
export function Section({ id, title, children, className }: { id?: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("scroll-mt-28", className)}>
      <h2 id={id ? `${id}-title` : undefined} className="display mb-5 text-[clamp(30px,3.6vw,44px)]">
        {title}
      </h2>
      <div className="prose-orack">{children}</div>
    </section>
  );
}
