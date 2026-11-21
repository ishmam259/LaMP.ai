"use client";

import { useSyncExternalStore } from "react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "cn";
import { useStrings, type StringKey } from "@/lib/strings";

const noSubscribe = () => () => {};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}

const ORDER = ["system", "light", "dark"] as const;
const META: Record<(typeof ORDER)[number], { icon: typeof Sun; label: StringKey }> = {
  system: { icon: Monitor, label: "THEME_AUTO" },
  light: { icon: Sun, label: "THEME_LIGHT" },
  dark: { icon: Moon, label: "THEME_DARK" },
};

/** Cycles automatic → light → dark. */
export function ThemeToggle({ className, withLabel = false, onRail = false }: { className?: string; withLabel?: boolean; onRail?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useStrings();
  // false while rendering on the server, true in the browser: the saved theme is known only there
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  const current = (mounted && (theme as (typeof ORDER)[number])) || "system";
  const { icon: Icon } = META[current];
  const label = t(META[current].label);
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={t("THEME_SWITCH", { now: label, next: t(META[next].label) })}
      title={label}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full",
        onRail ? "text-ink-2 hover:bg-cash-tint hover:text-cash" : "text-ink-2 hover:bg-muted hover:text-ink",
        withLabel ? "px-3 text-sm font-semibold" : "w-11 justify-center",
        className
      )}
    >
      <Icon className="size-5" aria-hidden />
      {withLabel && <span>{label}</span>}
    </button>
  );
}
