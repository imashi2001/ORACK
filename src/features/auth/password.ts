import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { PASSWORD_HASH_OPTIONS } from "./password-policy";

export function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_HASH_OPTIONS);
}

let dummyHash: Promise<string> | null = null;

/** Verifies a password. With no stored hash it still does the work, so response time doesn't reveal unknown emails. */
export async function verifyPassword(storedHash: string | null, password: string): Promise<boolean> {
  if (!storedHash) {
    dummyHash ??= hashPassword("orack-timing-equaliser");
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}
