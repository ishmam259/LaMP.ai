"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  Store,
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

/* The desktop side menu can be narrowed to icons. The choice is remembered in this browser only;
   if storage is blocked it still works until the page is reloaded. */
const RAIL_KEY = "lamp-rail-collapsed";
const RAIL_EVENT = "lamp:rail";
let railMemory = false;

function subscribeRail(onChange: () => void) {
  window.addEventListener(RAIL_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(RAIL_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function railCollapsed(): boolean {
  try {
    const v = window.localStorage.getItem(RAIL_KEY);
    return v === null ? railMemory : v === "1";
  } catch {
    return railMemory;
  }
}

function setRailCollapsed(value: boolean) {
  railMemory = value;
  try {
    window.localStorage.setItem(RAIL_KEY, value ? "1" : "0");
  } catch {
    /* private window or blocked storage: keep it in memory only */
  }
  window.dispatchEvent(new Event(RAIL_EVENT));
}

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
  const collapsed = useSyncExternalStore(subscribeRail, railCollapsed, () => false);
  const shop = pharmacy ? `${pharmacy.name}, ${pharmacy.city}` : "";

  return (
    <div
      className={cn(
        "min-h-dvh lg:grid lg:transition-[grid-template-columns] lg:duration-200 motion-reduce:transition-none",
        collapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[232px_1fr]",
        !onLog && (collapsed ? "xl:grid-cols-[76px_1fr_340px]" : "xl:grid-cols-[232px_1fr_340px]")
      )}
    >
      {/* Desktop rail: fits the screen without scrolling; on short screens it tightens up. */}
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-hidden border-r border-rule bg-rail text-rail-ink lg:flex">
        <div className="print-strip" />
        {/* Same height as the top bar, so the two rules meet in one line. */}
        <div className={cn("flex h-16 shrink-0 items-center border-b border-rule", collapsed ? "justify-center" : "justify-between pr-3 pl-5")}>
          {!collapsed && (
            <Link href="/" className="text-[1.875rem] leading-none" aria-label="LaMP, go to Today">
              <Wordmark onRail />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setRailCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand the menu" : "Shrink the menu"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand the menu" : "Shrink the menu"}
            className="inline-flex size-10 items-center justify-center rounded-xl text-ink-2 hover:bg-muted hover:text-ink"
          >
            {collapsed ? <PanelLeftOpen className="size-5" aria-hidden /> : <PanelLeftClose className="size-5" aria-hidden />}
          </button>
        </div>
        <div className={cn("flex shrink-0 items-center gap-3 pt-5 pb-4 short:hidden", collapsed ? "justify-center" : "px-5")} title={collapsed ? shop : undefined}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cash-tint text-cash">
            <Store className="size-5" aria-hidden />
          </span>
          {collapsed ? (
            <span className="sr-only">{shop}</span>
          ) : (
            <span className="min-w-0 leading-tight">
              <span className="line-clamp-2 block font-semibold text-ink">{pharmacy?.name ?? " "}</span>
              <span className="block truncate text-sm text-ink-2">{pharmacy?.city ?? " "}</span>
            </span>
          )}
        </div>
        <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col px-3 pb-3 short:pt-3">
          <div className="flex flex-col gap-0.5">
            {OWNER_NAV.map((item) => (
              <RailLink key={item.href} {...item} collapsed={collapsed} active={isActive(pathname, item.href)} />
            ))}
          </div>
          <div className="mx-3 my-3 h-px shrink-0 bg-rule short:my-2" aria-hidden />
          <div className="flex flex-col gap-0.5">
            {MORE_NAV.map((item) => (
              <RailLink
                key={item.href}
                {...item}
                collapsed={collapsed}
                active={isActive(pathname, item.href)}
                badge={item.href === "/actions" ? pending : 0}
              />
            ))}
          </div>
        </nav>
        <div className={cn("flex shrink-0 gap-1 border-t border-rule px-3 py-3", collapsed && "flex-col items-center")}>
          {!isLender && (
            <button
              type="button"
              onClick={startGuide}
              title={collapsed ? "Quick tour" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl text-[0.9375rem] font-semibold text-rail-2 hover:bg-muted hover:text-ink short:h-10",
                collapsed ? "w-11 justify-center" : "min-w-0 flex-1 px-3"
              )}
            >
              <Compass className="size-5 shrink-0" aria-hidden />
              <span className={collapsed ? "sr-only" : "truncate"}>Quick tour</span>
            </button>
          )}
          <ThemeToggle onRail className="shrink-0 rounded-xl short:h-10" />
          {!isLender && pharmacy?.asks_pin && (
            <button
              type="button"
              onClick={lock}
              aria-label="Lock"
              title="Lock"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-rail-2 hover:bg-alert-tint hover:text-alert short:h-10"
            >
              <LockKeyhole className="size-5" aria-hidden />
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
        <div className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-3 border-b border-rule bg-shelf/75 px-8 backdrop-blur-md lg:flex">
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
  collapsed,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      data-guide={GUIDE_SPOT[href]}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex h-11 shrink-0 items-center gap-3 rounded-xl text-[0.9375rem] font-semibold transition-colors short:h-9",
        collapsed ? "mx-auto w-11 justify-center" : "px-3",
        active ? "bg-cash-tint text-cash" : "text-rail-2 hover:bg-muted hover:text-ink"
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{label}</span>
      {badge > 0 && (
        <span
          className={cn(
            "num rounded-full bg-alert-band text-xs leading-5 font-bold text-white",
            collapsed ? "absolute -top-1 -right-1 min-w-5 px-1 text-center" : "px-2"
          )}
        >
          {badge}
          {collapsed && <span className="sr-only"> waiting</span>}
        </span>
      )}
    </Link>
  );
}
