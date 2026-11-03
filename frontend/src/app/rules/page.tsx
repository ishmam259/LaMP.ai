"use client";

import { Check, ExternalLink, KeyRound } from "lucide-react";
import { Carton, LoadError, PageTitle, Skel } from "@/components/carton";
import { PauseToggle } from "@/components/pause";
import { usePolicy } from "@/lib/api";
import { num } from "@/lib/format";
import type { ActionKind } from "@/lib/types";

const KIND: Record<ActionKind, string> = {
  return_claim: "Sending stock back",
  extension_request: "Asking a supplier for more days",
  loan_application: "Loan applications",
  set_aside: "Putting money aside each day",
  trim_order: "Ordering less",
};

/** Read-only view of the rules LaMP enforces (CORE-07): Pause, the PIN, the borrowing ceiling. */
export default function RulesPage() {
  const { data: p, error } = usePolicy();
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Rules" />
      {error && <LoadError what="the rules" />}
      {!p && !error && <Skel className="h-96" />}
      {p && (
        <div className="space-y-4">
          <Carton tone={p.paused ? "warn" : "ink"} title="Pause" aside={p.paused ? "Paused" : "Running"}>
            <div>
              <PauseToggle />
            </div>
          </Carton>

          <Carton tone="ink" title="Your approval">
            <ul className="space-y-2 text-ink">
              {(Object.keys(KIND) as ActionKind[]).map((k) => {
                const pin = p.pin_required_for.includes(k);
                return (
                  <li key={k} className="flex items-center gap-2">
                    {pin ? <KeyRound className="size-4 shrink-0 text-warn" aria-hidden /> : <Check className="size-4 shrink-0 text-stock" aria-hidden />}
                    <span className="flex-1">{KIND[k]}</span>
                    {pin && <span className="text-sm text-ink-2">PIN required</span>}
                  </li>
                );
              })}
            </ul>
          </Carton>

          <Carton tone="ink" title="Borrowing limit" aside={`${num(p.dbr_cap_pct)}% of what you keep each month`}>
            <a href={p.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-cash hover:underline">
              {p.source.issuer} rules <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Carton>
        </div>
      )}
    </div>
  );
}
