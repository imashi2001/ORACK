const lkr = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** 2500 → "Rs. 2,500" */
export function formatLKR(amount: number): string {
  return `Rs. ${lkr.format(amount)}`;
}

/** Normalises a Sri Lankan mobile number to 07XXXXXXXX, or returns null if invalid. */
export function normaliseSriLankanMobile(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const match = digits.match(/^(?:\+94|0094|94|0)?(7\d{8})$/);
  return match ? `0${match[1]}` : null;
}
