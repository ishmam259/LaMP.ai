"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { Explain } from "@/components/explain";
import { proposeAction, useAccount, useActions, useCatalogue, useForecast, useFundingPlan } from "@/lib/api";
import { bdt, dayDate, shortDate, stampDate } from "@/lib/format";
import type { ActionKind, CatalogueOut } from "@/lib/types";
import { resultSummary, waitingOn } from "@/lib/waiting";

/** 9 -> "9", 12.2 -> "12.2", 13.75 -> "13.75" */
const pct = (n: number) => String(Math.round(n * 100) / 100);

export default function FundingPage() {
  const { data: plan, error } = useFundingPlan();
  const { data: actions } = useActions();
  const { data: forecast } = useForecast();
  const { data: catalogue } = useCatalogue();
  const { data: account } = useAccount();
  const [busy, setBusy] = useState(false);

  // Every figure below comes from the API: the plan, its options, and the untrimmed forecast shortfall.
  const options = plan?.options ?? [];
  const trim = options.find((o) => o.key === "trim_order" && o.eligible);
  const primary = plan?.plan.steps.find((s) => s.action_kind !== "trim_order" && !s.fallback_for);
  const primaryOption = primary?.action_kind === "extension_request" ? options.find((o) => o.key === "supplier_extension") : undefined;
  const fallback = options
    .filter((o) => o.eligible && o.certainty === "certain" && o.cost_bdt != null && !["trim_order", "return_claims"].includes(o.key))
    .sort((a, b) => (a.cost_bdt ?? 0) - (b.cost_bdt ?? 0))[0];
  const hasFallback = !!plan?.plan.steps.some((s) => s.fallback_for);
  const untrimmed = forecast?.shortfalls[0]?.amount;

  const planKinds = new Set(plan?.plan.steps.map((s) => s.action_kind));
  // A step is taken while it waits in Actions, or while the lender or supplier hasn't answered yet.
  const waiting = waitingOn(actions, account);
  const waitingFor = (k: ActionKind) => (k === "loan_application" ? waiting.loan : k === "extension_request" ? waiting.extension : undefined);
  const inActions = actions?.some((a) => planKinds.has(a.kind) && a.kind !== "return_claim" && (a.status === "proposed" || a.status === "approved"));
  const waitingStep = plan?.plan.steps.find((s) => waitingFor(s.action_kind));
  const alreadyProposed = inActions || !!waitingStep;

  async function proposePlan() {
    if (!plan) return;
    setBusy(true);
    try {
      for (const s of plan.plan.steps) {
        await proposeAction(s.action_kind as ActionKind, {
          summary: s.label,
          amount: s.amount,
          when: s.when,
          ...(s.action_kind === "loan_application" ? { lender_id: "wallet-lender", product_key: "wallet_loan", fallback: true } : {}),
        });
      }
      toast.success("Plan added to Approvals. Approve each step there.");
    } catch {
      toast.error("Couldn't add the plan. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle title="Plan" />
      {error && <LoadError what="your plan" />}
      {!plan && !error && <Skel className="h-96" />}
      {plan && (
        <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0">
          <section aria-labelledby="need-head" className="station-board lg:col-span-12">
            <h2 id="need-head" className="sb-head">
              <span className="num">{bdt(plan.need.amount)} to cover</span>
              <span className="sb-time">by {dayDate(plan.need.needed_by)}</span>
            </h2>
            <Explain rows={plan.need.explain} title={`How ${bdt(plan.need.amount)} to cover was worked out`} onBoard />
            {trim && (
              <p className="sb-sub mt-1.5 text-[1.0625rem] font-medium">
                Left after you {trim.label.charAt(0).toLowerCase() + trim.label.slice(1)} ({bdt(trim.amount)} saved).
              </p>
            )}
          </section>
          {(waiting.loan || waiting.extension) && (
            <div className="space-y-4 lg:col-span-12">
              {waiting.loan && (
                <Carton tone="warn" title="Loan applied, waiting for the lender" aside={bdt(Number(waiting.loan.payload.amount ?? 0))}>
                  <p className="text-ink">
                    {resultSummary(waiting.loan) ?? "Your application is with the lender."}
                  </p>
                </Carton>
              )}
              {waiting.extension && (
                <Carton tone="warn" title="Asked for more days, waiting for the supplier">
                  <p className="text-ink">
                    {resultSummary(waiting.extension) ?? "Your request is with the supplier."}
                  </p>
                </Carton>
              )}
            </div>
          )}
          <div className="lg:col-span-12">
            <Carton tone="ink" title="Recommended plan" aside={primaryOption ? `Costs ${bdt(plan.plan.total_cost_bdt)} if ${primaryOption.provider} agrees` : `Costs ${bdt(plan.plan.total_cost_bdt)}`}>
              <ol className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                {plan.plan.steps.map((s, i) => (
                  <li key={s.label} className="flex gap-3">
                    <span className="num flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-ink">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{s.label}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Stamp tone={waitingFor(s.action_kind) ? "warn" : undefined}>
                          {s.action_kind === "loan_application" && waiting.loan
                            ? "Applied, waiting for the lender"
                            : s.action_kind === "extension_request" && waiting.extension
                              ? "Asked, waiting for the supplier"
                              : s.fallback_for
                                ? `If needed ${stampDate(s.when)}`
                                : `Now ${stampDate(s.when)}`}
                        </Stamp>
                        <span className="num text-sm text-ink-2">{bdt(s.amount)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              {untrimmed != null && untrimmed > plan.need.amount && (
                <div className="mt-4 border-t border-rule pt-3 text-ink">
                  Borrowing the full <span className="num">{bdt(untrimmed)}</span> straight away would cost{" "}
                  <span className="num font-bold">{bdt(plan.naive_cost_bdt)}</span> in interest, and you&apos;d still hold stock that expires. This plan costs{" "}
                  <span className="num font-bold">{bdt(plan.plan.total_cost_bdt)}</span>
                  {hasFallback && fallback && fallback.cost_bdt !== plan.plan.total_cost_bdt && (
                    <>
                      , or <span className="num font-bold">{bdt(fallback.cost_bdt!)}</span> if you need the loan
                    </>
                  )}
                  .
                </div>
              )}
              <Button size="lg" className="mt-4 w-full sm:w-auto" disabled={busy || !!alreadyProposed} onClick={proposePlan}>
                {inActions ? "Plan is waiting in Approvals" : waitingStep ? "Waiting for an answer" : "Add this plan to Approvals"}
              </Button>
              {inActions && (
                <Link href="/actions" className="mt-2 inline-flex items-center gap-1 font-semibold text-cash hover:underline sm:ml-3">
                  Go to Approvals <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </Carton>
          </div>

          <div className="lg:col-span-12">
            <Carton tone="ink" title="All options" aside="Cheapest first" bodyClassName="p-0">
              <ul className="divide-y divide-rule lg:grid lg:grid-cols-2 lg:divide-y-0">
                {plan.options.map((o) => (
                  <li key={o.key} className={`p-4 lg:border-b lg:border-rule ${o.eligible ? "" : "opacity-75"}`}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${o.eligible ? "bg-stock-tint text-stock" : "bg-muted text-ink-2"}`}
                        aria-label={o.eligible ? "Available" : "Not available"}
                      >
                        {o.eligible ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{o.label}</p>
                        <p className="text-sm text-ink-2">
                          {o.provider} · {o.speed}
                          {o.certainty === "uncertain" ? " · not guaranteed" : ""}
                        </p>
                        {!o.eligible && <p className="mt-1 text-sm text-ink">{o.reason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="num font-bold text-ink">{o.cost_bdt === null ? "—" : o.cost_bdt === 0 ? "Free" : bdt(o.cost_bdt)}</p>
                        {o.apr_pct !== null && <p className="num text-xs text-ink-2">{pct(o.apr_pct)}% a year</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Carton>
            {catalogue && <Catalogue c={catalogue} />}
            <p className="mt-3 text-sm">
              <Link href="/passport" className="font-semibold text-cash hover:underline">
                Your credit record
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Sourced Bangladeshi financing products matched to the need (CORE-14). */
function Catalogue({ c }: { c: CatalogueOut }) {
  return (
    <Carton
      tone="ink"
      title="Other loans you could get"
      aside={`${c.matched} found, ${c.eligible} you qualify for`}
      className="mt-4"
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-rule border-t border-rule">
        {c.options.map((o) => (
          <li key={o.key} className={`p-4 ${o.eligible ? "" : "opacity-75"}`}>
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${o.eligible ? "bg-stock-tint text-stock" : "bg-muted text-ink-2"}`}
                aria-label={o.eligible ? "You qualify" : "You don't qualify"}
              >
                {o.eligible ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{o.label}</p>
                <p className="text-sm text-ink-2">
                  {o.provider_type} · {o.speed_days === 0 ? "same day" : `about ${o.speed_days} day${o.speed_days === 1 ? "" : "s"}`}
                </p>
                {!o.eligible && o.ineligible_reason && <p className="mt-1 text-sm font-semibold text-ink">{o.ineligible_reason}</p>}
                {o.to_confirm.length > 0 && <p className="mt-1 text-sm text-ink-2">You&apos;ll need: {o.to_confirm.join(", ")}.</p>}
                <details className="mt-1 text-sm text-ink-2">
                  <summary className="cursor-pointer font-semibold text-cash">Where this comes from</summary>
                  <p className="mt-1">{o.note}</p>
                  <a href={o.source} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-cash hover:underline">
                    {o.anchored_on}
                    {o.source_date ? `, ${shortDate(o.source_date)} ${o.source_date.slice(0, 4)}` : ""}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </details>
              </div>
              <div className="text-right">
                <p className="num font-bold text-ink">{o.cost_of_gap_bdt == null ? "—" : bdt(o.cost_of_gap_bdt)}</p>
                {o.apr_pct != null && <p className="num text-xs text-ink-2">{pct(o.apr_pct)}% a year</p>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Carton>
  );
}
