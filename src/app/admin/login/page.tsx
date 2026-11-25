import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-ink px-5 py-16 text-white">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Link href="/" className="display text-5xl">
            ORACK.
          </Link>
          <span className="eyebrow text-[#8f8f8f]">Admin</span>
        </div>
        <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
          <LoginWithRedirect searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginWithRedirect({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : ""} />;
}
