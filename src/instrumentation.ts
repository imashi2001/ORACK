import type { Instrumentation } from "next";

/** Runs once when a server instance starts: fail fast on missing configuration. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkEnv } = await import("./lib/env");
  checkEnv();
}

/** Server-side errors (rendering, Server Actions, Route Handlers) as structured log lines. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { log } = await import("./lib/log");
  log.error("request_error", err, {
    digest: typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : undefined,
    method: request.method,
    path: request.path.split("?")[0],
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
