import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { CartProvider } from "@/features/cart/cart-provider";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { buildNav } from "@/config/site";
import { getShopCategories } from "@/features/products/queries";
import { SeasonalBanner } from "@/features/seasonal/components/seasonal-banner";
import { SeasonalEffects } from "@/features/seasonal/components/seasonal-effects";
import { getSeasonal } from "@/features/seasonal/queries";
import { getPublicSettings } from "@/features/settings/queries";
import { StoreSettingsProvider } from "@/features/settings/store-settings-provider";
import { buildWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [settings, categories, seasonal] = await Promise.all([getPublicSettings(), getShopCategories(), getSeasonal()]);
  // Decorations only while the season is switched on and inside its dates.
  const season = seasonal.live ? seasonal.settings : null;
  const nav = buildNav(categories);
  const whatsappUrl = buildWhatsAppUrl(generalEnquiryMessage, settings.whatsappNumber);
  return (
    <StoreSettingsProvider
      value={{
        whatsappNumber: settings.whatsappNumber,
        deliveryInfo: settings.deliveryInfo,
        sizeGuide: settings.sizeGuide,
      }}
    >
      <CartProvider>
        {season?.bannerEnabled && <SeasonalBanner settings={season} />}
        <AnnouncementBar items={settings.announcement} />
        <SiteHeader
          whatsappUrl={whatsappUrl}
          nav={nav}
          lights={season && season.lights !== "off" ? season.lights : null}
          categories={categories.map((c) => c.name)}
          socials={{
            instagram: settings.instagramUrl,
            tiktok: settings.tiktokUrl,
            facebook: settings.facebookUrl,
            email: settings.contactEmail,
          }}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter whatsappUrl={whatsappUrl} settings={settings} categories={categories} />
        <WhatsAppFab whatsappUrl={whatsappUrl} />
        <CartDrawer />
        {season && season.effect !== "none" && <SeasonalEffects settings={season} />}
      </CartProvider>
    </StoreSettingsProvider>
  );
}
