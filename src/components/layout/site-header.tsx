"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowRightIcon, ChevronDownIcon, MenuIcon, MinusIcon, PlusIcon, SearchIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { SHOP_HREF, type NavCategory, type NavItem } from "@/config/site";
import { useCart } from "@/features/cart/cart-provider";
import { FacebookIcon, InstagramIcon, MailIcon, TikTokIcon, WhatsAppIcon } from "@/components/shop/icons";
import { Container } from "@/components/shop/container";
import { cn } from "@/lib/utils";
import { LogoHorizontal } from "@/components/brand/logo";
import { StringLights } from "@/features/seasonal/components/string-lights";

const iconBtn =
  "relative inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const linkClass =
  "relative py-3 text-white/80 transition-colors after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 aria-[current=page]:text-white aria-[current=page]:after:scale-x-100";

const BASE_SEARCHES = ["Oversized", "Black", "White", "Graphic"];

const countLabel = (n: number) => `${n} ${n === 1 ? "style" : "styles"}`;

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

interface ShopControls {
  open: boolean;
  onHover: () => void;
  onToggle: () => void;
  onLeaveItem: () => void;
}

/** Desktop links. Highlighting reads the pathname (request data), so it streams in behind Suspense. */
function PrimaryLinks({ pathname, nav, shop }: { pathname: string | null; nav: NavItem[]; shop: ShopControls }) {
  return (
    <>
      {nav.map((item) =>
        item.href === SHOP_HREF ? (
          // Hovering "Shop" opens the category menu, clicking the word goes to every product,
          // and the chevron opens the menu for keyboard and touch users.
          <span key={item.label} className="flex items-center gap-0.5" onPointerEnter={(e) => e.pointerType === "mouse" && shop.onHover()}>
            <Link href={item.href} aria-current={isActive(pathname, item.href) || shop.open ? "page" : undefined} className={linkClass}>
              {item.label}
            </Link>
            <button
              type="button"
              aria-label={shop.open ? "Close the shop menu" : "Open the shop menu"}
              aria-expanded={shop.open}
              aria-controls="shop-menu"
              onClick={shop.onToggle}
              className="-mr-2 flex size-7 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronDownIcon className={cn("size-3.5 transition-transform duration-300", shop.open && "rotate-180")} />
            </button>
          </span>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive(pathname, item.href) && !shop.open ? "page" : undefined}
            className={linkClass}
            onPointerEnter={(e) => e.pointerType === "mouse" && shop.onLeaveItem()}
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

function ActivePrimaryLinks(props: { nav: NavItem[]; shop: ShopControls }) {
  return <PrimaryLinks pathname={usePathname()} {...props} />;
}

/** Desktop mega menu under the bar: every category, quick links, and a couple of category photos. */
function ShopMenu({ categories, onClose }: { categories: NavCategory[]; onClose: () => void }) {
  const featured = categories.filter((c) => c.image).slice(0, 2);
  const explore = [
    { label: "All products", href: "/products" },
    { label: "New arrivals", href: "/products?sort=newest" },
    { label: "Custom designs", href: "/customize" },
    { label: "Size guide", href: "/size-guide" },
    { label: "How ordering works", href: "/#how-it-works" },
  ];
  return (
    <div id="shop-menu" className="absolute inset-x-0 top-full hidden h-[calc(100dvh-4.5rem)] flex-col lg:flex">
      <div className="animate-in fade-in slide-in-from-top-2 border-y border-white/10 bg-ink duration-200">
        <div className="mx-auto grid max-w-[1360px] grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)_auto] gap-12 px-6 py-10">
          <div className="flex flex-col gap-5">
            <span className="eyebrow text-white/45">Shop by category</span>
            <ul className={cn("grid gap-x-10 gap-y-1", categories.length > 5 && "grid-cols-2")}>
              {categories.map((c) => (
                <li key={c.slug} className="min-w-0">
                  <Link href={`/products?category=${c.slug}`} onClick={onClose} className="group flex items-baseline gap-3 py-1.5">
                    <span className="street truncate text-[28px] leading-none uppercase transition-transform duration-300 group-hover:translate-x-1">{c.name}</span>
                    <span className="eyebrow shrink-0 text-[10px] text-white/40 group-hover:text-white/70">{countLabel(c.productCount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/products" onClick={onClose} className="mt-2 inline-flex items-center gap-2 self-start border-b-[1.5px] border-white pb-0.5 text-sm font-semibold hover:opacity-70">
              Shop all products <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-5 border-l border-white/10 pl-12">
            <span className="eyebrow text-white/45">Explore</span>
            <ul className="flex flex-col gap-3 text-[15px]">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onClose} className="text-white/75 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            {featured.length > 0 ? (
              featured.map((c) => (
                <Link key={c.slug} href={`/products?category=${c.slug}`} onClick={onClose} className="group relative block aspect-[4/5] w-[190px] overflow-hidden bg-[#1b1b1b] xl:w-[210px]">
                  <Image
                    src={c.image!.url}
                    alt=""
                    fill
                    sizes="210px"
                    className="object-cover grayscale-[0.85] transition-[transform,filter] duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.85),transparent_55%)]" />
                  <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                    <span className="street text-2xl leading-none uppercase">{c.name}</span>
                    <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))
            ) : (
              <Link href="/customize" onClick={onClose} className="group flex w-[260px] flex-col justify-between gap-6 bg-paper p-6 text-ink">
                <span className="eyebrow text-[10px] text-smoke">Studio</span>
                <span className="display text-[44px]">
                  <span className="block">Custom</span>
                  <span className="block">designs</span>
                </span>
                <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.14em] uppercase">
                  Create now <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Dims the page. Moving the mouse onto it or clicking it closes the menu. */}
      <div aria-hidden="true" className="animate-in fade-in flex-1 bg-black/45 duration-300" onClick={onClose} onPointerEnter={(e) => e.pointerType === "mouse" && onClose()} />
    </div>
  );
}

/**
 * Site header.
 * - On the homepage it starts transparent over the hero photo (CSS `over-hero` variant, so there is no flash before JS),
 *   and turns into a solid, blurred bar once you scroll. Other pages always get the solid bar.
 * - Categories sit in the Shop menu (a mega menu on desktop, an expandable list on phones), so the bar stays
 *   five links long however many categories there are.
 */
export function SiteHeader({
  whatsappUrl,
  socials,
  nav,
  categories,
  lights,
}: {
  whatsappUrl: string;
  socials: HeaderSocials;
  nav: NavItem[];
  categories: NavCategory[];
  /** Seasonal string lights along the bottom edge. */
  lights?: "warm" | "colour" | null;
}) {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  // When the pointer reaches the chevron, hovering has already opened the menu; that click shouldn't shut it again.
  const hoverOpenedAt = useRef(0);

  const shop: ShopControls = {
    open: shopOpen,
    onHover: () => {
      window.clearTimeout(closeTimer.current);
      if (!shopOpen) hoverOpenedAt.current = Date.now();
      setShopOpen(true);
      setSearchOpen(false);
    },
    onToggle: () => {
      window.clearTimeout(closeTimer.current);
      setSearchOpen(false);
      if (shopOpen && Date.now() - hoverOpenedAt.current < 1500) {
        hoverOpenedAt.current = 0;
        return;
      }
      setShopOpen(!shopOpen);
    },
    onLeaveItem: () => {
      window.clearTimeout(closeTimer.current);
      setShopOpen(false);
    },
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
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
    if (!menuOpen && !searchOpen && !shopOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setSearchOpen(false);
      setShopOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen, searchOpen, shopOpen]);

  const panelOpen = menuOpen || searchOpen || shopOpen;
  const closeAll = () => {
    window.clearTimeout(closeTimer.current);
    setMenuOpen(false);
    setSearchOpen(false);
    setShopOpen(false);
  };
  const socialLinks = [
    { label: "Instagram", href: socials.instagram, icon: InstagramIcon },
    { label: "TikTok", href: socials.tiktok, icon: TikTokIcon },
    { label: "Facebook", href: socials.facebook, icon: FacebookIcon },
  ].filter((s): s is typeof s & { href: string } => !!s.href);

  return (
    <header
      data-solid={scrolled || panelOpen ? "" : undefined}
      onPointerEnter={() => window.clearTimeout(closeTimer.current)}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse" || !shopOpen) return;
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setShopOpen(false), 180);
      }}
      className={cn(
        // The divider is an inset shadow rather than a border so the bar is exactly h-18 tall (the hero tucks under it by that much).
        "sticky top-0 z-40 bg-ink/95 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[background-color,box-shadow] duration-300 ease-out",
        scrolled && "shadow-[inset_0_-1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.3)]",
        "over-hero:bg-transparent over-hero:shadow-none over-hero:backdrop-blur-none",
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
          <Suspense fallback={<PrimaryLinks pathname={null} nav={nav} shop={shop} />}>
            <ActivePrimaryLinks nav={nav} shop={shop} />
          </Suspense>
        </nav>

        <div className="col-start-3 -mr-2.5 flex items-center justify-end gap-0.5">
          <button
            type="button"
            className={iconBtn}
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            aria-controls="site-search-panel"
            onPointerEnter={(e) => e.pointerType === "mouse" && shopOpen && shop.onLeaveItem()}
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
              setShopOpen(false);
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

      {lights && !panelOpen && <StringLights mode={lights} />}

      {shopOpen && <ShopMenu categories={categories} onClose={closeAll} />}

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
                placeholder="Search tees, colours, prints…"
                className="h-14 flex-1 border-b-[1.5px] border-white/20 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/40 focus:border-white sm:text-2xl"
              />
              <button type="submit" className={cn(iconBtn, "border border-white/20")} aria-label="Submit search">
                <ArrowRightIcon className="size-5" />
              </button>
            </form>
            <div className="flex flex-col gap-4">
              <ChipRow label="Popular">
                {BASE_SEARCHES.map((q) => (
                  <Chip key={q} href={`/products?q=${encodeURIComponent(q)}`} onClick={closeAll}>
                    {q}
                  </Chip>
                ))}
              </ChipRow>
              {categories.length > 0 && (
                <ChipRow label="Categories">
                  {categories.map((c) => (
                    <Chip key={c.slug} href={`/products?category=${c.slug}`} onClick={closeAll}>
                      {c.name}
                    </Chip>
                  ))}
                </ChipRow>
              )}
            </div>
          </Container>
        </div>
      )}

      {menuOpen && (
        <div id="mobile-menu" className="animate-in fade-in absolute inset-x-0 top-full flex h-[calc(100dvh-4.5rem)] flex-col overflow-y-auto border-t border-white/10 bg-ink duration-200 lg:hidden">
          <Container className="flex flex-1 flex-col justify-between gap-10 pt-6 pb-28">
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                {nav.map((item, i) => {
                  const number = (
                    <span aria-hidden="true" className="eyebrow w-6 text-white/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  );
                  return (
                    <li key={item.label} className="animate-in fade-in slide-in-from-left-4 fill-mode-both border-b border-white/10 duration-500" style={{ animationDelay: `${60 + i * 45}ms` }}>
                      {item.href === SHOP_HREF && categories.length > 0 ? (
                        <>
                          <button
                            type="button"
                            aria-expanded={mobileShopOpen}
                            aria-controls="mobile-shop"
                            onClick={() => setMobileShopOpen((v) => !v)}
                            className="flex w-full items-baseline gap-4 py-3.5 text-left"
                          >
                            {number}
                            <span className="street text-[40px] leading-none">{item.label}</span>
                            <span className="eyebrow ml-auto self-center text-[10px] text-white/40">{categories.length} categories</span>
                            {mobileShopOpen ? (
                              <MinusIcon aria-hidden="true" className="size-5 shrink-0 self-center text-white" />
                            ) : (
                              <PlusIcon aria-hidden="true" className="size-5 shrink-0 self-center text-white/60" />
                            )}
                          </button>
                          {mobileShopOpen && (
                            <ul id="mobile-shop" className="animate-in fade-in slide-in-from-top-1 grid grid-cols-2 gap-x-4 pb-5 pl-10 duration-200">
                              <li className="col-span-2">
                                <Link href={item.href} onClick={closeAll} className="flex items-center gap-2 py-2.5 text-[15px] font-semibold">
                                  Shop all products <ArrowRightIcon aria-hidden="true" className="size-4" />
                                </Link>
                              </li>
                              {categories.map((c) => (
                                <li key={c.slug} className="min-w-0">
                                  <Link href={`/products?category=${c.slug}`} onClick={closeAll} className="flex flex-col gap-0.5 py-2.5">
                                    <span className="truncate text-[15px] text-white/85">{c.name}</span>
                                    <span className="eyebrow text-[9px] text-white/40">{countLabel(c.productCount)}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <Link href={item.href} onClick={closeAll} className="group flex items-baseline gap-4 py-3.5">
                          {number}
                          <span className="street text-[40px] leading-none transition-transform group-hover:translate-x-1.5">{item.label}</span>
                          <ArrowRightIcon aria-hidden="true" className="ml-auto size-5 self-center text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                        </Link>
                      )}
                    </li>
                  );
                })}
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
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`ORACK on ${label}`}
                        className="flex size-11 items-center justify-center border border-white/20 text-white/80 hover:border-white hover:text-white"
                      >
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

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow w-full text-white/50 sm:mr-2 sm:w-24">{label}</span>
      {children}
    </div>
  );
}

function Chip({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="rounded-full border border-white/20 px-3.5 py-1.5 text-[13px] text-white/80 transition-colors hover:border-white hover:bg-white hover:text-ink">
      {children}
    </Link>
  );
}
