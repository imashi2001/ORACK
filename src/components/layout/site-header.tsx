"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { MenuIcon, SearchIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { mainNav } from "@/config/site";
import { useCart } from "@/features/cart/cart-provider";
import { WhatsAppIcon } from "@/components/shop/icons";
import { Container } from "@/components/shop/container";
import { cn } from "@/lib/utils";

const iconBtn = "relative inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/10";

function isActive(pathname: string | null, href: string) {
  if (!pathname || href.includes("?") || href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Desktop links. Highlighting reads the pathname (request data), so it streams in behind Suspense. */
function PrimaryLinks({ pathname }: { pathname: string | null }) {
  return (
    <>
      {mainNav.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="relative py-3 after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100 aria-[current=page]:after:scale-x-100"
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

function ActivePrimaryLinks() {
  return <PrimaryLinks pathname={usePathname()} />;
}

export function SiteHeader({ whatsappUrl }: { whatsappUrl: string }) {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1d1d1d] bg-ink/92 text-white backdrop-blur-md">
      <Container className="flex h-18 items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(iconBtn, "lg:hidden")}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((v) => !v);
              setSearchOpen(false);
            }}
          >
            {menuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
          <Link href="/" className="display text-4xl tracking-[-0.02em]" onClick={() => setMenuOpen(false)}>
            ORACK.
          </Link>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-9 text-sm font-medium lg:flex">
          <Suspense fallback={<PrimaryLinks pathname={null} />}>
            <ActivePrimaryLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={iconBtn}
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
          >
            <SearchIcon className="size-5" />
          </button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={cn(iconBtn, "hidden sm:inline-flex")} aria-label="Chat with ORACK on WhatsApp">
            <WhatsAppIcon className="size-5" />
          </a>
          <button type="button" className={iconBtn} aria-label={`Open bag, ${count} items`} onClick={() => setOpen(true)}>
            <ShoppingBagIcon className="size-5" />
            {/* Re-keyed on change so the count "bumps" when something is added. */}
            <span key={count} className="animate-bump absolute top-1 right-0.5 min-w-4.5 rounded-full bg-white px-1.5 text-center text-[10px] leading-4.5 font-bold text-ink">
              {count}
            </span>
          </button>
        </div>
      </Container>

      {searchOpen && (
        <div className="border-t border-[#1d1d1d] bg-ink">
          <Container className="py-4">
            <form action="/products" className="flex items-center gap-3" onSubmit={() => setSearchOpen(false)}>
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <input
                id="site-search"
                name="q"
                type="search"
                autoFocus
                placeholder="Search tees, hoodies, colours…"
                className="h-13 flex-1 border-b-[1.5px] border-[#3a3a3a] bg-transparent text-xl font-medium text-white outline-none placeholder:text-[#8f8f8f] focus:border-white"
              />
              <button type="submit" className={iconBtn} aria-label="Submit search">
                <SearchIcon className="size-5" />
              </button>
            </form>
          </Container>
        </div>
      )}

      {menuOpen && (
        <nav aria-label="Mobile" className="border-t border-[#1d1d1d] bg-ink pb-7 lg:hidden">
          <Container className="flex flex-col">
            {mainNav.map((item) => (
              <Link key={item.label} href={item.href} className="display py-2 text-5xl" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
