import { describe, expect, it } from "vitest";
import { formatLKR, normaliseSriLankanMobile } from "@/lib/format";
import { buildCustomizationMessage, buildOrderMessage, buildQuotationMessage, buildWhatsAppUrl, toWhatsAppDigits } from "@/lib/whatsapp";

describe("formatLKR", () => {
  it("formats rupees with thousands separators", () => {
    expect(formatLKR(2500)).toBe("Rs. 2,500");
    expect(formatLKR(1234567.5)).toBe("Rs. 1,234,567.5");
    expect(formatLKR(0)).toBe("Rs. 0");
  });
});

describe("normaliseSriLankanMobile", () => {
  it.each([
    ["0771234567", "0771234567"],
    ["077 123 4567", "0771234567"],
    ["+94 77 123 4567", "0771234567"],
    ["94771234567", "0771234567"],
    ["0094-77-123-4567", "0771234567"],
    ["(077) 123-4567", "0771234567"],
  ])("accepts %s", (input, expected) => {
    expect(normaliseSriLankanMobile(input)).toBe(expected);
  });

  it.each(["12345", "0112345678", "07712345678", "abcdefghij", ""])("rejects %s", (input) => {
    expect(normaliseSriLankanMobile(input)).toBeNull();
  });
});

describe("WhatsApp links", () => {
  it("converts local numbers to international digits for wa.me", () => {
    expect(toWhatsAppDigits("077 123 4567")).toBe("94771234567");
    expect(toWhatsAppDigits("+94 77 123 4567")).toBe("94771234567");
    expect(toWhatsAppDigits("0094771234567")).toBe("94771234567");
  });

  it("encodes the message and falls back to the chooser when no number is set", () => {
    const url = buildWhatsAppUrl("Hi & thanks?\nRef: ORK-1", "0771234567");
    expect(url).toBe("https://wa.me/94771234567?text=Hi%20%26%20thanks%3F%0ARef%3A%20ORK-1");
    expect(buildWhatsAppUrl("Hi", "")).toBe("https://wa.me/?text=Hi");
  });

  it("builds an order message with every line, the total and the reference", () => {
    const msg = buildOrderMessage({
      reference: "ORK-261125-ABCDE",
      customerName: "Nimal",
      customerPhone: "0771234567",
      deliveryAddress: "12 Galle Road",
      items: [
        { productName: "Tee", colorName: "Black", size: "M", quantity: 2, lineTotal: 5000 },
        { productName: "Hoodie", colorName: "White", size: "L", quantity: 1, lineTotal: 4900 },
      ],
      total: 9900,
      note: "Gift",
    });
    expect(msg).toContain("ORK-261125-ABCDE");
    expect(msg).toContain("• Tee — Black / M × 2 — Rs. 5,000");
    expect(msg).toContain("Total: Rs. 9,900");
    expect(msg).toContain("Note: Gift");
  });

  it("builds customization and quotation messages", () => {
    expect(
      buildCustomizationMessage({ reference: "CUS-1", customerName: "A", productName: "Tee", colorName: "Black", size: "M", quantity: 3, placements: ["Front", "Back"], designDescription: "Logo", imageCount: 2 }),
    ).toContain("Placement: Front, Back");
    const quote = buildQuotationMessage({ customerName: "Kasun Silva", reference: "CUS-1", version: 2, productName: "Tee", colorName: "White", size: "M", quantity: 10, unitPrice: 2800, setupFee: 2000, deliveryFee: 500, total: 30500 });
    expect(quote).toContain("Hi Kasun");
    expect(quote).toContain("(revision 2)");
    expect(quote).toContain("× 10 @ Rs. 2,800 = Rs. 28,000");
    expect(quote).toContain("Total: Rs. 30,500");
  });
});
