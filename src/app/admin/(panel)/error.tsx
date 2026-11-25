"use client";

import { useEffect } from "react";
import { adminButton } from "@/features/admin/components/ui";

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest: unknown }).digest) : null;

  return (
    <div className="flex flex-col items-start gap-4 border border-[#f1c9c6] bg-white p-8">
      <h1 className="display text-4xl">Something went wrong</h1>
      <p className="text-sm text-smoke">The page couldn&apos;t load. Your data hasn&apos;t been changed. Try again, and if it keeps failing, check the server logs{digest ? ` for error ${digest}` : ""}.</p>
      <button type="button" onClick={() => retry()} className={adminButton()}>
        Try again
      </button>
    </div>
  );
}
