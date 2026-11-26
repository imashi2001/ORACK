"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowRightIcon, MenuIcon, SearchIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { mainNav } from "@/config/site";
import { useCart } from "@/features/cart/cart-provider";
import { FacebookIcon, InstagramIcon, MailIcon, TikTokIcon, WhatsAppIcon } from "@/components/shop/icons";
import { Container } from "@/components/shop/container";
import { cn } from "@/lib/utils";
import { LogoHorizontal } from "@/components/brand/logo";

const iconBtn =
  "relative inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const QUICK_SEARCHES = ["Oversized tee", "Hoodie", "Black", "White", "Graphic"];

export interface HeaderSocials {
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  email: string | null;
}

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
          className="relative py-3 text-white/80 transition-colors after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 aria-[current=page]:text-white aria-[current=page]:after:scale-x-100"
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

/**
 * Site header.
 * - On the homepage it starts transparent over the hero photo (CSS `over-hero` variant, so there is no flash before JS),
 *   and turns into a solid, blurred bar once you scroll. Other pages always get the solid bar.
 * - It slides away while scrolling down a long page and comes back as soon as you scroll up.
 */
export function SiteHeader({ whatsappUrl, socials }: { whatsappUrl: string; socials: HeaderSocials }) {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        setScrolled(y > 12);
        if (y < 320) setHidden(false);
        else if (delta > 8) setHidden(true);
        else if (delta < -8) setHidden(false);
        lastY.current = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Escape closes panels; the page behind the mobile menu doesn't scroll.
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen, searchOpen]);

  const panelOpen = menuOpen || searchOpen;
  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };
  const socialLinks = [
    { label: "Instagram", href: socials.instagram, icon: InstagramIcon },
    { label: "TikTok", href: socials.tiktok, icon: TikTokIcon },
    { label: "Facebook", href: socials.facebook, icon: FacebookIcon },
  ].filter((s): s is typeof s & { href: string } => !!s.href);

  return (
    <header
      data-solid={scrolled || panelOpen ? "" : undefined}
      className={cn(
        // The divider is an inset shadow rather than a border so the bar is exactly h-18 tall (the hero tucks under it by that much).
        "sticky top-0 z-40 bg-ink/95 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[background-color,transform,box-shadow] duration-300 ease-out",
        scrolled && "shadow-[inset_0_-1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.3)]",
        "over-hero:bg-transparent over-hero:shadow-none over-hero:backdrop-blur-none",
        hidden && !panelOpen && "-translate-y-full",
      )}
    >
      <Container className="relative grid h-18 grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(iconBtn, "-ml-2.5 lg:hidden")}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => {
              setMenuOpen((v) => !v);
              setSearchOpen(false);
            }}
          >
            {menuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
          <Link href="/" aria-label="ORACK home" className="py-2 text-[26px] transition-opacity hover:opacity-80 sm:text-[28px]" onClick={closeAll}>
            <LogoHorizontal title="ORACK" />
          </Link>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-8 text-[12px] font-semibold tracking-[0.22em] uppercase lg:flex">
          <Suspense fallback={<PrimaryLinks pathname={null} />}>
            <ActivePrimaryLinks />
          </Suspense>
        </nav>

        <div className="-mr-2.5 flex items-center justify-end gap-0.5">
          <button
            type="button"
            className={iconBtn}
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            aria-controls="site-search-panel"
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
          >
            {searchOpen ? <XIcon className="size-5" /> : <SearchIcon className="size-5" />}
          </button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={cn(iconBtn, "hidden sm:inline-flex")} aria-label="Chat with ORACK on WhatsApp">
            <WhatsAppIcon className="size-5" />
          </a>
          <button type="button" className={iconBtn} aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`} onClick={() => setOpen(true)}>
            <ShoppingBagIcon className="size-5" />
            {count > 0 && (
              // Re-keyed on change so the count "bumps" when something is added.
              <span key={count} className="animate-bump absolute top-1 right-0.5 min-w-4.5 rounded-full bg-white px-1.5 text-center text-[10px] leading-4.5 font-bold text-ink">
                {count}
              </span>
            )}
          </button>
        </div>
      </Container>

      {searchOpen && (
        <div id="site-search-panel" className="animate-in fade-in slide-in-from-top-2 absolute inset-x-0 top-full border-y border-white/10 bg-ink duration-200">
          <Container className="flex flex-col gap-5 py-6">
            <form action="/products" className="flex items-center gap-3" onSubmit={closeAll}>
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <SearchIcon aria-hidden="true" className="size-6 shrink-0 text-white/50" />
              <input
                id="site-search"
                name="q"
                type="search"
                autoFocus
                autoComplete="off"
                placeholder="Search tees, hoodies, colours…"
                className="h-14 flex-1 border-b-[1.5px] border-white/20 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/40 focus:border-white sm:text-2xl"
              />
              <button type="submit" className={cn(iconBtn, "border border-white/20")} aria-label="Submit search">
                <ArrowRightIcon className="size-5" />
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-2 text-white/50">Popular</span>
              {QUICK_SEARCHES.map((q) => (
                <Link
                  key={q}
                  href={`/products?q=${encodeURIComponent(q)}`}
                  onClick={closeAll}
                  className="rounded-full border border-white/20 px-3.5 py-1.5 text-[13px] text-white/80 transition-colors hover:border-white hover:bg-white hover:text-ink"
                >
                  {q}
                </Link>
              ))}
            </div>
          </Container>
        </div>
      )}

      {menuOpen && (
        <div
          id="mobile-menu"
          className="animate-in fade-in absolute inset-x-0 top-full flex h-[calc(100dvh-4.5rem)] flex-col overflow-y-auto border-t border-white/10 bg-ink duration-200 lg:hidden"
        >
          <Container className="flex flex-1 flex-col justify-between gap-10 pt-6 pb-28">
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                {mainNav.map((item, i) => (
                  <li key={item.label} className="animate-in fade-in slide-in-from-left-4 fill-mode-both border-b border-white/10 duration-500" style={{ animationDelay: `${60 + i * 45}ms` }}>
                    <Link href={item.href} onClick={closeAll} className="group flex items-baseline gap-4 py-3.5">
                      <span aria-hidden="true" className="eyebrow w-6 text-white/40">{String(i + 1).padStart(2, "0")}</span>
                      <span className="street text-[40px] leading-none transition-transform group-hover:translate-x-1.5">{item.label}</span>
                      <ArrowRightIcon aria-hidden="true" className="ml-auto size-5 self-center text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="animate-in fade-in fill-mode-both flex flex-col gap-6 delay-300 duration-500">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-13 items-center justify-center gap-2.5 bg-white text-[13px] font-semibold tracking-[0.16em] text-ink uppercase"
              >
                <WhatsAppIcon className="size-5" /> Order on WhatsApp
              </a>
              <div className="flex items-center justify-between gap-4">
                <ul className="flex gap-2">
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`ORACK on ${label}`} className="flex size-11 items-center justify-center border border-white/20 text-white/80 hover:border-white hover:text-white">
                        <Icon className="size-[18px]" />
                      </a>
                    </li>
                  ))}
                </ul>
                {socials.email && (
                  <a href={`mailto:${socials.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                    <MailIcon className="size-4" /> Email us
                  </a>
                )}
              </div>
              <p className="eyebrow text-white/40">Live Bold. Wear ORACK.</p>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
