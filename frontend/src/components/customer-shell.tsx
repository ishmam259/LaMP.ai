"use client";

import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme";
import { BuildathonSticker } from "@/components/sticker";

/** Customer pages (/me, /me/<code>): the patient's own view, outside the owner's app. */
export function isCustomerPath(pathname: string) {
  return pathname === "/me" || pathname.startsWith("/me/");
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-rule bg-rail/80 text-rail-ink backdrop-blur-md">
        <div className="print-strip" />
        <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 py-2">
          <Link href="/me" className="display text-[1.875rem] leading-none font-bold tracking-tight">
            La<span className="display-accent">M</span>P
          </Link>
          <BuildathonSticker className="ml-1 h-8" />
          <span className="flex-1" />
          <ThemeToggle onRail />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-12">{children}</main>
      <footer className="mx-auto w-full max-w-xl px-4 pb-6 text-xs text-ink-2">
        Run a pharmacy?{" "}
        <Link href="/" className="font-semibold text-cash underline underline-offset-2">
          Open the owner app
        </Link>
        .
      </footer>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
