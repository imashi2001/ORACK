"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { FolderTreeIcon, LayoutDashboardIcon, MenuIcon, PaletteIcon, PackageIcon, SettingsIcon, ShoppingCartIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCartIcon },
  { href: "/admin/customizations", label: "Custom requests", icon: PaletteIcon },
  { href: "/admin/products", label: "Products", icon: PackageIcon },
  { href: "/admin/categories", label: "Categories", icon: FolderTreeIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function ActiveLinks({ onNavigate }: { onNavigate: () => void }) {
  return <Links pathname={usePathname()} onNavigate={onNavigate} />;
}

/** Highlights the current section. The pathname is request data, so it streams in behind Suspense. */
function Links({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = !!pathname && (exact ? pathname === href : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn("flex h-10 items-center gap-3 px-3 text-sm font-medium transition-colors", active ? "bg-white text-ink" : "text-[#bdbdbd] hover:bg-white/8 hover:text-white")}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminNav({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const links = (
    <Suspense fallback={<Links pathname={null} onNavigate={close} />}>
      <ActiveLinks onNavigate={close} />
    </Suspense>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <Link href="/admin" className="display text-2xl">
          ORACK.
        </Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="flex size-10 items-center justify-center">
          {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>
      {open && <div className="bg-ink px-3 pb-4 lg:hidden">{links}{children}</div>}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-8 bg-ink px-3 py-6 text-white lg:flex">
        <Link href="/admin" className="flex items-baseline gap-2 px-3">
          <span className="display text-3xl">ORACK.</span>
          <span className="eyebrow text-[10px] text-[#8f8f8f]">Admin</span>
        </Link>
        {links}
        <div className="mt-auto">{children}</div>
      </aside>
    </>
  );
}
