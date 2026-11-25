"use client";

import { createContext, useContext } from "react";

interface StoreSettings {
  whatsappNumber: string;
  deliveryInfo: string | null;
}

const StoreSettingsContext = createContext<StoreSettings>({ whatsappNumber: "", deliveryInfo: null });

/** Exposes the few public settings that Client Components need (WhatsApp number, delivery text). */
export function StoreSettingsProvider({ value, children }: { value: StoreSettings; children: React.ReactNode }) {
  return <StoreSettingsContext value={value}>{children}</StoreSettingsContext>;
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}
