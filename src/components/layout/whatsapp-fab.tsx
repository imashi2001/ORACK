import { WhatsAppIcon } from "@/components/shop/icons";

export function WhatsAppFab({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ORACK on WhatsApp"
      className="wa-fab fixed right-6 bottom-6 z-30 inline-flex h-14 items-center gap-2.5 rounded-full border-[1.5px] border-ink bg-white pr-5 pl-4 text-sm font-semibold text-ink shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition-colors hover:bg-ink hover:text-white max-sm:w-14 max-sm:justify-center max-sm:p-0"
    >
      <WhatsAppIcon className="size-5.5" />
      <span className="max-sm:hidden">Chat with us</span>
    </a>
  );
}
