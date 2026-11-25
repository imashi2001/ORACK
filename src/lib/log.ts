/**
 * Minimal structured logging. Vercel captures stdout/stderr, so JSON lines are
 * searchable in the dashboard. Never log passwords, tokens, or full addresses.
 */
type Level = "info" | "warn" | "error";

function write(level: Level, event: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...data });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => write("warn", event, data),
  error: (event: string, error: unknown, data?: Record<string, unknown>) =>
    write("error", event, {
      ...data,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack?.split("\n").slice(0, 6).join("\n") } : String(error),
    }),
};
