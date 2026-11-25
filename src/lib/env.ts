import { log } from "./log";

/**
 * Startup configuration check. Missing required variables stop a production server
 * from starting; optional features only produce a warning.
 */
export function checkEnv() {
  const env = process.env;
  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");

  if (missing.length) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    if (env.NODE_ENV === "production") throw new Error(message);
    log.warn("env_missing", { missing });
  }

  const r2Base = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].filter((k) => !env[k]);
  if (r2Base.length) log.warn("r2_not_configured", { missing: r2Base, effect: "photo and reference-image uploads are disabled" });
  if (env.R2_PUBLIC_BASE_URL && !/^https?:\/\//.test(env.R2_PUBLIC_BASE_URL)) log.warn("r2_public_base_url_invalid");
  if (env.NODE_ENV === "production" && env.R2_PUBLIC_BASE_URL?.startsWith("http://")) log.warn("r2_public_base_url_not_https");
}
