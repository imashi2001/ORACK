import Link from "next/link";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const adminButton = cva(
  "inline-flex items-center justify-center gap-2 border text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "border-ink bg-ink text-white hover:bg-[#2c2c2c]",
        secondary: "border-line bg-white text-ink hover:border-ink",
        ghost: "border-transparent bg-transparent text-ink hover:bg-ink/5",
        danger: "border-[#f1c9c6] bg-white text-destructive hover:border-destructive hover:bg-[#fdf3f2]",
      },
      size: { sm: "h-9 px-3", md: "h-11 px-4.5" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const adminInput =
  "h-11 w-full border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-[#9a9a97] focus:border-ink aria-invalid:border-destructive disabled:bg-paper";
export const adminTextarea = cn(adminInput, "h-auto min-h-24 py-2.5 leading-relaxed");
export const adminLabel = "text-[13px] font-semibold text-ink";

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {back && (
          <Link href={back.href} className="text-[13px] text-smoke hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="display text-[44px]">{title}</h1>
        {description && <p className="text-sm text-smoke">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className }: { title?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border border-line bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-smoke">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="eyebrow text-smoke">{label}</span>
      <span className="display text-5xl not-italic">{value}</span>
      {hint && <span className="text-[13px] text-smoke">{hint}</span>}
    </>
  );
  const cls = "flex flex-col gap-2 border border-line bg-white p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-ink")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const BADGE_TONES = {
  neutral: "bg-paper text-graphite border-line",
  dark: "bg-ink text-white border-ink",
  amber: "bg-[#fff7e6] text-[#8a5300] border-[#f3d9a4]",
  blue: "bg-[#eef4ff] text-[#1d4ed8] border-[#c7d7fb]",
  green: "bg-[#ecfdf3] text-[#166534] border-[#bbe5c9]",
  red: "bg-[#fdf3f2] text-[#b3261e] border-[#f1c9c6]",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center border px-2 py-0.5 text-xs font-semibold whitespace-nowrap", BADGE_TONES[tone])}>{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 border border-dashed border-line bg-white p-8">
      <p className="font-semibold">{title}</p>
      {children && <div className="text-sm text-smoke">{children}</div>}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-12 w-72 bg-[#e6e6e3]" />
      <div className="h-64 border border-line bg-white" />
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  return message ? (
    <p role="alert" className="text-[13px] font-medium text-destructive">
      {message}
    </p>
  ) : null;
}
