"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BadgeCheck,
  Camera,
  Compass,
  CreditCard,
  HandCoins,
  Inbox,
  LockKeyhole,
  MessageCircle,
  PackageOpen,
  ScrollText,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "cn";
import { lock, useActions, usePharmacy } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatPanel } from "@/components/chat-panel";
import { LiveLog } from "@/components/live-log";
import { ThemeToggle } from "@/components/theme";
import { PausedBanner, PauseToggle } from "@/components/pause";
import { NotificationBridge } from "@/components/notifications";
import { BuildathonSticker } from "@/components/sticker";
import { CustomerShell, isCustomerPath } from "@/components/customer-shell";
import { Guide, startGuide } from "@/components/guide";

/** The spots the first-visit guide points at (components/guide.tsx). */
const GUIDE_SPOT: Record<string, string> = { "/capture": "scan", "/actions": "approvals", "/customers": "customers" };

const OWNER_NAV = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/cash", label: "Cash", icon: Wallet },
  { href: "/capture", label: "Scan", icon: Camera },
  { href: "/stock", label: "Stock", icon: PackageOpen },
  { href: "/funding", label: "Plan", icon: HandCoins },
];

const MORE_NAV = [
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/actions", label: "Approvals", icon: Inbox },
  { href: "/passport", label: "Credit record", icon: BadgeCheck },
  { href: "/wallet", label: "Wallet", icon: CreditCard },
  { href: "/rules", label: "Rules", icon: ShieldCheck },
  { href: "/log", label: "History", icon: ScrollText },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Wordmark({ className, onRail = false }: { className?: string; onRail?: boolean }) {
  return (
    <span className={cn("display font-bold tracking-tight", onRail ? "text-rail-ink" : "text-ink", className)}>
      La<span className="display-accent">M</span>P
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isCustomerPath(pathname) ? <CustomerShell>{children}</CustomerShell> : <OwnerShell>{children}</OwnerShell>;
}

function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: pharmacy } = usePharmacy();
  const { data: actions } = useActions();
  const [chatOpen, setChatOpen] = useState(false);
  const pending = actions?.filter((a) => a.status === "proposed").length ?? 0;
  const isLender = pathname.startsWith("/lender");
  const onLog = pathname.startsWith("/log");

  return (
    <div className={cn("min-h-dvh lg:grid lg:grid-cols-[232px_1fr]", !onLog && "xl:grid-cols-[232px_1fr_340px]")}>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule bg-rail/85 text-rail-ink backdrop-blur-md lg:flex">
        <div className="print-strip" />
        <div className="px-6 pt-6 pb-5">
          <Link href="/" className="text-[2rem] leading-none">
            <Wordmark onRail />
          </Link>
          <p className="mt-2 text-sm text-rail-2">{pharmacy ? `${pharmacy.name}, ${pharmacy.city}` : " "}</p>
        </div>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {[...OWNER_NAV, ...MORE_NAV].map((item) => (
            <RailLink key={item.href} {...item} active={isActive(pathname, item.href)} badge={item.href === "/actions" ? pending : 0} />
          ))}
        </nav>
        <div className="space-y-1 border-t border-rule p-4">
          {!isLender && (
            <button
              type="button"
              onClick={startGuide}
              className="flex h-10 w-full items-center gap-3 rounded-full px-3 text-sm font-semibold text-rail-2 hover:bg-cash-tint hover:text-cash"
            >
              <Compass className="size-5" aria-hidden /> Show me around
            </button>
          )}
          <ThemeToggle withLabel onRail className="w-full" />
          {!isLender && pharmacy?.asks_pin && (
            <button
              type="button"
              onClick={lock}
              className="flex h-10 w-full items-center gap-3 rounded-full border border-rule px-3 text-sm font-semibold text-rail-2 hover:bg-alert-tint hover:text-alert"
            >
              <LockKeyhole className="size-5" aria-hidden /> Lock
            </button>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-rule bg-rail/80 text-rail-ink backdrop-blur-md lg:hidden">
          <div className="print-strip" />
          <div className="flex items-center gap-1 px-4 py-2">
            <Link href="/" className="text-[1.875rem] leading-none">
              <Wordmark onRail />
            </Link>
            <BuildathonSticker className="ml-2 hidden h-8 sm:block" />
            <span className="flex-1" />
            {!isLender && <PauseToggle onRail />}
            <ThemeToggle onRail />
            <Link
              href="/passport"
              aria-label="Credit record"
              aria-current={isActive(pathname, "/passport") ? "page" : undefined}
              className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-muted hover:text-ink aria-[current=page]:bg-cash-tint aria-[current=page]:text-cash"
            >
              <BadgeCheck className="size-5" aria-hidden />
            </Link>
            <Link
              href="/actions"
              data-guide="approvals"
              aria-label={`Approvals, ${pending} waiting for you`}
              className="relative inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-muted hover:text-ink"
            >
              <Inbox className="size-5" aria-hidden />
              {pending > 0 && (
                <span className="num absolute top-1.5 right-1.5 min-w-5 rounded-full bg-alert-band px-1 text-center text-xs leading-5 font-bold text-white">
                  {pending}
                </span>
              )}
            </Link>
            {!isLender && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                data-guide="ask"
                className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-glow"
              >
                <MessageCircle className="size-5" aria-hidden /> Ask
              </button>
            )}
          </div>
          {/* Phones have no room in the row above, so the sticker gets its own line. */}
          <div className="flex justify-center pb-2 sm:hidden">
            <BuildathonSticker className="h-8" />
          </div>
        </header>

        {/* Desktop top bar */}
        <div className="sticky top-0 z-30 hidden items-center justify-end gap-3 border-b border-rule bg-shelf/75 px-8 py-3 backdrop-blur-md lg:flex">
          <BuildathonSticker className="mr-auto h-10" />
          {isLender ? (
            <span className="text-sm font-semibold text-ink-2">Lender portal</span>
          ) : (
            <>
            <PauseToggle />
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              data-guide="ask"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-glow hover:bg-[color-mix(in_srgb,var(--primary),black_12%)]"
            >
              <MessageCircle className="size-5" aria-hidden /> Ask LaMP
            </button>
            </>
          )}
        </div>

        <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 pt-5 pb-32 lg:px-8 lg:pt-8 lg:pb-12">
          {!isLender && <PausedBanner />}
          {children}
        </main>

        {/* Phone tab bar */}
        <nav
          aria-label="Main"
          className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-30 grid w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 grid-cols-5 rounded-2xl border border-rule bg-board/85 p-1 shadow-lift backdrop-blur-md lg:hidden"
        >
          {OWNER_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                data-guide={GUIDE_SPOT[href]}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold",
                  active ? "bg-cash-tint text-cash" : "text-ink-2 hover:text-ink"
                )}
              >
                <Icon className="size-[22px]" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop history column (the History page shows it full width instead) */}
      {!onLog && (
        <aside className="sticky top-0 hidden h-dvh flex-col border-l border-rule bg-board/70 backdrop-blur-md xl:flex">
          <LiveLog />
        </aside>
      )}

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
          <SheetHeader className="border-b border-rule">
            <SheetTitle className="text-lg">Ask LaMP</SheetTitle>
          </SheetHeader>
          <ChatPanel />
        </SheetContent>
      </Sheet>

      {!isLender && <NotificationBridge />}
      {!isLender && <Guide />}
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      data-guide={GUIDE_SPOT[href]}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold",
        active
          ? "bg-cash-tint text-cash before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-full before:bg-cash"
          : "text-rail-2 hover:bg-muted hover:text-ink"
      )}
    >
      <Icon className="size-5" aria-hidden />
      <span className="flex-1">{label}</span>
      {badge > 0 && <span className="num rounded-full bg-alert-band px-2 text-xs leading-5 font-bold text-white">{badge}</span>}
    </Link>
  );
}
