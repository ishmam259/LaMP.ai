"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CirclePause, CirclePlay } from "lucide-react";
import { cn } from "cn";
import { setPaused, usePause } from "@/lib/api";
import { useStrings } from "@/lib/strings";

/** "Pause LaMP": stops the copilot and the scheduler from proposing, and blocks approving what they proposed. */
/** onlyWhenPaused: the phone header shows it only while paused, so the owner can resume from any page. */
export function PauseToggle({ onRail = false, onlyWhenPaused = false }: { onRail?: boolean; onlyWhenPaused?: boolean }) {
  const { data } = usePause();
  const [busy, setBusy] = useState(false);
  const { t } = useStrings();
  if (!data || (onlyWhenPaused && !data.paused)) return null;
  const paused = data.paused;

  async function toggle() {
    setBusy(true);
    try {
      await setPaused(!paused);
      toast(paused ? t("RESUMED_TOAST") : t("PAUSED_TOAST"));
    } catch {
      toast.error(t("PAUSE_ERROR"));
    } finally {
      setBusy(false);
    }
  }

  const Icon = paused ? CirclePlay : CirclePause;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={paused}
      aria-label={t("PAUSE")}
      disabled={busy}
      onClick={toggle}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[0.9375rem] font-semibold disabled:opacity-60",
        paused
          ? "bg-warn-band text-white"
          : onRail
            ? "px-3 text-ink-2 hover:bg-muted hover:text-ink"
            : "border border-rule bg-board text-ink shadow-[0_1px_2px_rgb(20_32_27/0.05)] hover:bg-muted"
      )}
    >
      <Icon className="size-5" aria-hidden />
      <span className={onRail ? "sr-only sm:not-sr-only" : undefined}>{paused ? t("RESUME") : t("PAUSE")}</span>
      {onRail && paused && <span className="sm:hidden">{t("PAUSED")}</span>}
    </button>
  );
}

export function PausedBanner() {
  const { data } = usePause();
  const { t } = useStrings();
  if (!data?.paused) return null;
  return (
    <p role="status" className="mb-4 rounded-[var(--radius)] border border-warn/40 bg-warn-tint p-3 font-semibold text-warn">
      {t("PAUSED_BANNER")}
    </p>
  );
}
