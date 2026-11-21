"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePharmacy } from "@/lib/api";
import { useStrings, type StringKey } from "@/lib/strings";

/**
 * A short first-visit guide. It opens by itself only once per browser, on the first visit to
 * Today: it counts as seen as soon as it opens, so a reload or leaving halfway never brings it
 * back. It points at the real buttons (whichever copy is on screen: phone tab bar or desktop
 * rail) and can be replayed with "Quick tour". Spots are marked with data-guide="<key>".
 */

export const GUIDE_EVENT = "lamp:guide";
const SEEN_KEY = "lamp-guide-seen";

/** Start the guide (from a "Quick tour" button). */
export function startGuide() {
  window.dispatchEvent(new Event(GUIDE_EVENT));
}

type Step = { key?: string; title: StringKey; text: StringKey };

const STEPS: Step[] = [
  { title: "GUIDE_1_T", text: "GUIDE_1_X" },
  { key: "today", title: "GUIDE_2_T", text: "GUIDE_2_X" },
  { key: "scan", title: "GUIDE_3_T", text: "GUIDE_3_X" },
  { key: "approvals", title: "GUIDE_4_T", text: "GUIDE_4_X" },
  { key: "ask", title: "GUIDE_5_T", text: "GUIDE_5_X" },
  { key: "customers", title: "GUIDE_6_T", text: "GUIDE_6_X" },
];

function seen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* private window or blocked storage: the guide may show again, which is fine */
  }
}

/** The copy of a marked spot that is on screen now (the other one is display: none). */
function visibleTarget(key?: string): HTMLElement | null {
  if (!key) return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-guide="${key}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

const PAD = 6; // space between the spot and its highlight
const GAP = 12; // space between the highlight and the card
const EDGE = 16; // keep the card this far from the screen edge

export function Guide() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: pharmacy } = usePharmacy();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  const shop = pharmacy ? `${pharmacy.name}, ${pharmacy.city}` : "a sample pharmacy";
  const { t } = useStrings();
  const list = useMemo(
    () => STEPS.map((s) => ({ key: s.key, title: t(s.title), text: t(s.text, { shop }) })),
    [shop, t]
  );
  const current = step === null ? null : list[step];

  const place = (p: { top: number; left: number }) =>
    setPos((old) => (old && old.top === p.top && old.left === p.left ? old : p));

  const close = useCallback(() => {
    markSeen();
    setStep(null);
  }, []);

  // First visit: start on Today once the page has settled.
  useEffect(() => {
    if (pathname !== "/" || seen()) return;
    const t = window.setTimeout(() => {
      markSeen();
      setStep((s) => s ?? 0);
    }, 700);
    return () => window.clearTimeout(t);
  }, [pathname]);

  // "Quick tour": go to Today first, since the first spots are there.
  useEffect(() => {
    const start = () => {
      if (window.location.pathname !== "/") router.push("/");
      setStep(0);
    };
    window.addEventListener(GUIDE_EVENT, start);
    return () => window.removeEventListener(GUIDE_EVENT, start);
  }, [router]);

  // Bring the spot into view when the step changes.
  useEffect(() => {
    if (!current) return;
    const el = visibleTarget(current.key);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
    next.current?.focus();
  }, [current]);

  // Follow the spot: pages fill in as figures arrive, and the reader may scroll or resize.
  useEffect(() => {
    if (!current) return;
    const measure = () => {
      const r = visibleTarget(current.key)?.getBoundingClientRect() ?? null;
      setRect((old) =>
        old === r || (old && r && old.top === r.top && old.left === r.left && old.width === r.width && old.height === r.height)
          ? old
          : r
      );
    };
    measure();
    const t = window.setInterval(measure, 200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current]);

  // Place the card under the spot, or above it when there's no room, or in the middle.
  useLayoutEffect(() => {
    if (!current || !card.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { offsetWidth: w, offsetHeight: h } = card.current;
    if (!rect) {
      place({ top: Math.max(EDGE, (vh - h) / 2), left: (vw - w) / 2 });
      return;
    }
    const below = rect.bottom + PAD + GAP;
    const above = rect.top - PAD - GAP - h;
    const top = below + h <= vh - EDGE ? below : above >= EDGE ? above : Math.max(EDGE, vh - h - EDGE);
    const left = Math.min(Math.max(EDGE, rect.left + rect.width / 2 - w / 2), vw - w - EDGE);
    place({ top, left });
  }, [current, rect]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, close]);

  if (step === null || !current) return null;
  const last = step === list.length - 1;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-[calc(var(--radius)+4px)] outline-2 outline-signal transition-all duration-200 motion-reduce:transition-none"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.6)",
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-black/60" />
      )}

      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        aria-describedby="guide-text"
        className="fixed w-[min(340px,calc(100vw-32px))] rounded-[var(--radius)] border border-rule bg-board p-4 text-ink shadow-xl"
        style={pos ?? { top: -9999, left: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-ink-2 uppercase">
            {t("GUIDE_STEP", { a: step + 1, b: list.length })}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label={t("GUIDE_CLOSE")}
            className="-mt-1.5 -mr-1.5 inline-flex size-8 items-center justify-center rounded-[var(--radius)] text-ink-2 hover:bg-muted hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <h2 id="guide-title" className="mt-1 text-lg font-bold">
          {current.title}
        </h2>
        <p id="guide-text" className="mt-1 text-[0.9375rem] leading-snug text-ink-2">
          {current.text}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {step === 0 ? (
            <Button variant="ghost" size="sm" onClick={close}>
              {t("GUIDE_SKIP")}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              {t("GUIDE_BACK")}
            </Button>
          )}
          <span className="flex-1" />
          <Button ref={next} size="sm" onClick={() => (last ? close() : setStep(step + 1))}>
            {last ? t("GUIDE_DONE") : step === 0 ? t("GUIDE_SHOW") : t("GUIDE_NEXT")}
          </Button>
        </div>
      </div>
    </div>
  );
}
