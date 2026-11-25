import "server-only";
import { randomInt } from "node:crypto";

// Crockford base32 without I, L, O, U — easy to read out over the phone.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** ORK-261125-7K3QF style reference. The DB unique constraint is the final guard against collisions. */
export function generateReference(prefix: "ORK" | "CUS", now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${yy}${mm}${dd}-${suffix}`;
}
