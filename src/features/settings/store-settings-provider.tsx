"use client";

import { createContext, useContext } from "react";
import { parseSizeGuide, type SizeGuide } from "./size-guide";

interface StoreSettings {
  whatsappNumber: string;
  deliveryInfo: string | null;
  sizeGuide: SizeGuide;
}

const StoreSettingsContext = createContext<StoreSettings>({ whatsappNumber: "", deliveryInfo: null, sizeGuide: parseSizeGuide(null) });

/** Exposes the few public settings that Client Components need (WhatsApp number, delivery text, size chart). */
export function StoreSettingsProvider({ value, children }: { value: StoreSettings; children: React.ReactNode }) {
  return <StoreSettingsContext value={value}>{children}</StoreSettingsContext>;
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}
