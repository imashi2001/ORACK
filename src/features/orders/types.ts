export interface PricedLine {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  size: string;
  colorName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface StockIssue {
  variantId: string;
  productName: string;
  requested: number;
  available: number;
}

export type PlaceOrderResult =
  | { ok: true; reference: string; lines: PricedLine[]; total: number; whatsappUrl: string; message: string; persisted: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]>; stockIssues?: StockIssue[] };
