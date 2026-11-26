"use client";

import { LogoStacked } from "@/components/brand/logo";

// Last-resort boundary: replaces the root layout, so it renders its own <html>.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <main style={{ padding: 24 }}>
          <h1 style={{ fontSize: 40, margin: "0 0 16px", display: "flex", justifyContent: "center" }}>
            {/* No site CSS here, so size the logo explicitly. */}
            <span style={{ display: "block", width: 180 }}>
              <LogoStacked title="ORACK" />
            </span>
          </h1>
          <p style={{ color: "#c9c9c9", margin: "0 0 24px" }}>Something went wrong. Please try again.</p>
          <button type="button" onClick={() => retry()} style={{ padding: "14px 24px", background: "#fff", color: "#0a0a0a", border: 0, fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
