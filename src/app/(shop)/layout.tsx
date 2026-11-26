import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { CartProvider } from "@/features/cart/cart-provider";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { getPublicSettings } from "@/features/settings/queries";
import { StoreSettingsProvider } from "@/features/settings/store-settings-provider";
import { buildWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const settings = await getPublicSettings();
  const whatsappUrl = buildWhatsAppUrl(generalEnquiryMessage, settings.whatsappNumber);
  return (
    <StoreSettingsProvider value={{ whatsappNumber: settings.whatsappNumber, deliveryInfo: settings.deliveryInfo }}>
      <CartProvider>
        <AnnouncementBar items={settings.announcement} />
        <SiteHeader
          whatsappUrl={whatsappUrl}
          socials={{ instagram: settings.instagramUrl, tiktok: settings.tiktokUrl, facebook: settings.facebookUrl, email: settings.contactEmail }}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter whatsappUrl={whatsappUrl} settings={settings} />
        <WhatsAppFab whatsappUrl={whatsappUrl} />
        <CartDrawer />
      </CartProvider>
    </StoreSettingsProvider>
  );
}
