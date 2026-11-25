import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { logout } from "@/features/auth/actions";
import { requireAdmin } from "@/features/auth/dal";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — ORACK Admin" },
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <AdminNav>
        <Suspense fallback={<div className="h-20" aria-hidden="true" />}>
          <UserMenu />
        </Suspense>
      </AdminNav>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}

async function UserMenu() {
  const user = await requireAdmin();
  return (
    <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
      <div className="px-3 pb-2">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="eyebrow text-[10px] text-[#8f8f8f]">{user.role}</p>
      </div>
      <Link href="/" target="_blank" className="flex h-9 items-center gap-3 px-3 text-sm text-[#bdbdbd] hover:text-white">
        <ExternalLinkIcon className="size-4" aria-hidden="true" /> View store
      </Link>
      <form action={logout}>
        <button type="submit" className="flex h-9 w-full items-center gap-3 px-3 text-sm text-[#bdbdbd] hover:text-white">
          <LogOutIcon className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
    </div>
  );
}
