"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { subscribeLogs, useLogVerify } from "@/lib/api";
import { shortDate, timeOfDay } from "@/lib/format";
import type { LogEvent } from "@/lib/types";

// Tiers say who acted, not whether it went well, so the chips stay neutral.
// Only failed or blocked events use the alert colour.
const TIERS: { tier: LogEvent["tier"]; label: string }[] = [
  { tier: "T0", label: "Viewed" },
  { tier: "T1", label: "You & LaMP" },
  { tier: "T2", label: "Calculations" },
  { tier: "T3", label: "Money" },
];

/** The part of LaMP that wrote the event, in the owner's words. */
const PART: Record<string, string> = {
  DEV: "App",
  SYSTEM: "App",
  AUTH: "Sign-in",
  ACTIONS: "Approvals",
  EXECUTOR: "Approvals",
  REGISTRY: "Double-loan check",
  PATIENT: "Customer",
  FOLLOWUP: "Follow-up",
  NOTIFY: "Alert",
  CONSENT: "Sharing",
  EXPIRY: "Stock",
  CAPTURE: "Scan",
  FORECAST: "Cash",
  CASH: "Cash",
  POLICY: "Rules",
  PAYOUT: "Wallet",
  WALLET: "Wallet",
};
const part = (c: string) => PART[c] ?? c.charAt(0) + c.slice(1).toLowerCase();

const tierWord = (t: LogEvent["tier"]) => TIERS.find((x) => x.tier === t)?.label ?? t;

const isProblem = (e: LogEvent) => /blocked|failed|declined|rejected|refused|suspicious/.test(e.event);

const money = (v: unknown) => `BDT ${Number(v).toLocaleString("en-US")}`;
const words = (v: unknown) => String(v ?? "").replaceAll("_", " ");
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Action kinds with their article, as the owner would say them. */
const KIND: Record<string, string> = {
  return_claim: "sending stock back",
  trim_order: "a smaller order",
  extension_request: "asking for more days",
  loan_application: "a loan application",
  set_aside: "putting money aside",
};
const kind = (v: unknown) => KIND[String(v)] ?? `a ${words(v)}`;

/** Each event in the owner's words; anything new falls back to the event name. */
function sentence(e: LogEvent): string {
  const d = e.data;
  switch (e.event) {
    case "shortfall_detected":
      return `Short ${money(d.amount)} on ${shortDate(String(d.date))}`;
    case "batches_at_risk":
      return `${d.batches} batches worth ${money(d.value)} expire soon`;
    case "action_proposed":
      return `Suggested ${kind(d.kind)}`;
    case "action_approved_by_owner":
      return `Owner approved ${kind(d.kind)}`;
    case "action_executed":
      return `Done: ${kind(d.kind)}`;
    case "action_failed":
      return `Couldn't do ${kind(d.kind)}: ${words(d.reason)}`;
    case "lock_rejected":
      return `Refused: ${d.invoice} already has a loan against it`;
    case "extension_declined":
      return `${d.supplier} said no to more days`;
    case "extension_accepted":
      return `${d.supplier} agreed to more days`;
    case "capture_created":
      return "Photo read; waiting for the owner to check it";
    case "forecast_updated":
      return "Cash for the next 30 days worked out again";
    case "inbox_viewed":
      return "A lender opened its inbox";
    case "chat_message":
      return "Owner asked LaMP a question";
    case "owner_locked":
      return "Owner locked the app";
    case "action_rejected":
      return "Owner declined a suggestion";
    case "order_trimmed":
      return `Order cut from ${money(d.from)} to ${money(d.to)}`;
    case "return_claim_sent":
      return `Stock worth ${money(d.amount)} sent back to suppliers`;
    case "extension_requested":
      return `Asked ${d.supplier} for ${d.days} more days`;
    case "set_aside_scheduled":
      return `Set aside ${money(d.amount)}`;
    case "consent_granted":
      return `Credit record shared with ${who(d.lender)}`;
    case "consent_withdrawn":
      return `Stopped sharing with ${who(d.lender)}`;
    case "application_blocked_no_consent":
      return `Blocked: ${who(d.lender)} has no permission to see the credit record`;
    case "lock_acquired":
      return `${d.invoice} marked so it can't get a second loan`;
    case "application_submitted":
      return `Loan application for ${money(d.amount)} sent`;
    case "application_approved":
      return "Lender approved the application";
    case "application_declined":
      return "Lender declined the application";
    case "document_read":
      return `Read a ${d.kind === "invoice" ? "supplier invoice" : "sales book page"}`;
    case "suspicious_text_flagged":
      return "Ignored instructions written inside a document";
    case "capture_confirmed":
      return "Owner saved a photo to the accounts";
    case "reset":
      return "Shop figures loaded";
    case "notify":
      return `Alert: ${d.title}`;
    case "owner_unlocked":
      return "Owner unlocked with the PIN";
    case "approval_pin_rejected":
      return "Wrong PIN at a loan approval";
    case "agent_paused":
      return "Owner paused LaMP";
    case "agent_resumed":
      return "Owner resumed LaMP";
    case "unlock_failed":
      return "Wrong PIN entered";
    case "consent_revoked":
      return `Stopped sharing with ${who(d.lender)}`;
    case "followup_scheduled":
      return "Follow-up scheduled for the plan";
    case "followup_fired":
      return "Follow-up due: the backup step is ready";
    case "followup_cancelled":
      return "Follow-up no longer needed";
    case "followup_held_paused":
      return "Follow-up held: LaMP is paused";
    case "proposal_refused_paused":
    case "approval_refused_paused":
      return "Refused: LaMP is paused";
    case "loan_refused_dbr":
      return "Refused: the loan breaks the borrowing limit";
    case "answer_blocked_untraced":
      return "Held back a chat answer with a figure LaMP couldn't check";
    case "plan_set":
      return `${d.customer} promised to pay ${money(d.amount)}${d.parts === 1 ? " in one go" : ` in ${d.parts} weekly parts`}`;
    case "sandbox_payout":
    case "wallet_credited":
      return `${money(d.amount)} arrived in the wallet`;
    case "extension_no_reply":
      return `${d.supplier} didn't answer about more days`;
    case "demo_auto_reset":
      return "Shop figures loaded again";
    case "system_error":
      return "Something went wrong; LaMP noted it";
    default:
      return capital(words(e.event));
  }
}

/** "wallet-lender" -> "Wallet Lender" */
function who(id: unknown): string {
  return String(id).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function LiveLog() {
  const { data: chain, mutate: recheck } = useLogVerify();
  const [live, setLive] = useState<LogEvent[]>([]);
  const [filter, setFilter] = useState<LogEvent["tier"] | "all">("all");
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(
    () =>
      subscribeLogs(
        (e) => setLive((prev) => (prev.some((p) => p.id === e.id) ? prev : [...prev, e])),
        // Every (re)connect replays the whole log, and after a reset the ids restart: start again.
        () => setLive([])
      ),
    []
  );
  // Check the history again whenever a new entry arrives.
  useEffect(() => {
    if (live.length) recheck();
  }, [live.length, recheck]);

  const events = useMemo(() => {
    const seen = new Set<string>();
    const all = live.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
    return all.filter((e) => filter === "all" || e.tier === filter);
  }, [live, filter]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <section aria-label="History" className="flex h-full min-h-0 flex-col">
      <div className="band band-ink">
        <span>History</span>
      </div>
      {chain && (
        <p
          role="status"
          className={cn(
            "flex items-center gap-1.5 border-b border-rule px-3 py-1.5 text-xs font-semibold",
            chain.intact ? "text-stock" : "bg-alert-tint text-alert"
          )}
        >
          {chain.intact ? <ShieldCheck className="size-4 shrink-0" aria-hidden /> : <ShieldAlert className="size-4 shrink-0" aria-hidden />}
          {chain.intact ? (
            <span>
              Checked · <span className="num">{chain.count}</span> entries, none changed
            </span>
          ) : (
            <span>Someone changed this history after it was saved</span>
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 border-b border-rule px-3 py-2">
        {(["all", ...TIERS.map((x) => x.tier)] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={filter === t}
            onClick={() => setFilter(t)}
            className={cn(
              "h-8 rounded-[var(--radius)] px-2.5 text-xs font-bold",
              filter === t ? "bg-ink text-board" : "bg-muted text-ink-2 hover:text-ink"
            )}
          >
            {t === "all" ? "All" : tierWord(t)}
          </button>
        ))}
      </div>
      <ol ref={listRef} className="min-h-0 flex-1 overflow-y-auto text-sm" aria-live="polite">
        {events.length === 0 && <li className="p-4 text-ink-2">Nothing yet. What you and LaMP do appears here.</li>}
        {events.map((e) => (
          <li key={e.id} className="border-b border-rule px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="num font-board text-ink-2">{timeOfDay(e.ts)}</span>
              <span className="rounded-[2px] bg-muted px-1.5 text-xs font-bold text-ink">{tierWord(e.tier)}</span>
              <span className="text-xs font-bold text-ink-2">{part(e.component)}</span>
            </div>
            <p className={cn("mt-0.5 font-semibold break-words", isProblem(e) ? "text-alert" : "text-ink")}>{sentence(e)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
