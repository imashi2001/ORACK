// Shared by the app and scripts/create-admin.ts (no server-only import so tsx can load it).

export const MIN_PASSWORD_LENGTH = 10;

/** Argon2id, OWASP-recommended baseline parameters. */
export const PASSWORD_HASH_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;
