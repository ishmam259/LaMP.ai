"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { Explain } from "@/components/explain";
import { proposeAction, useAccount, useActions, useCatalogue, useForecast, useFundingPlan } from "@/lib/api";
import { bdt, dayDate, shortDate } from "@/lib/format";
import { useStrings } from "@/lib/strings";
import type { ActionKind, CatalogueOut } from "@/lib/types";
import { waitingOn } from "@/lib/waiting";

/** 9 -> "9", 12.2 -> "12.2", 13.75 -> "13.75" */
const pct = (n: number) => String(Math.round(n * 100) / 100);

export default function FundingPage() {
  const { data: plan, error } = useFundingPlan();
  const { data: actions } = useActions();
  const { data: forecast } = useForecast();
  const { data: catalogue } = useCatalogue();
  const { data: account } = useAccount();
  const [busy, setBusy] = useState(false);
  const { t } = useStrings();

  // Every figure below comes from the API: the plan, its options, and the untrimmed forecast shortfall.
  const options = plan?.options ?? [];
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
      toast.success(t("PLAN_ADDED"));
    } catch {
      toast.error(t("PLAN_ADD_ERROR"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle title={t("NAV_PLAN")} />
      {error && <LoadError what="your plan" />}
      {!plan && !error && <Skel className="h-96" />}
      {plan && (
        <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0">
          <section aria-labelledby="need-head" className="station-board lg:col-span-12">
            <p className="sb-label mb-3">{t("PLAN_NEED")}</p>
            <h2 id="need-head" className="sb-head">
              <span>
                <span className="num display-accent whitespace-nowrap">{bdt(plan.need.amount)}</span> {t("PLAN_TO_COVER")}
              </span>
              <span className="sb-time">{t("PLAN_BY", { date: dayDate(plan.need.needed_by) })}</span>
            </h2>
            <Explain rows={plan.need.explain} title={`${bdt(plan.need.amount)} ${t("PLAN_TO_COVER")}`} onBoard />
          </section>
          <div className="lg:col-span-12">
            <Carton tone="ink" title={t("PLAN_RECOMMENDED")} aside={primaryOption ? t("PLAN_COSTS_IF", { amount: bdt(plan.plan.total_cost_bdt), who: primaryOption.provider }) : t("PLAN_COSTS", { amount: bdt(plan.plan.total_cost_bdt) })}>
              <ol className="space-y-2.5 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                {plan.plan.steps.map((s, i) => (
                  <li key={s.label} className="flex gap-3">
                    <span className="num flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-ink">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{s.label}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Stamp tone={waitingFor(s.action_kind) ? "warn" : undefined}>
                          {s.action_kind === "loan_application" && waiting.loan
                            ? t("PLAN_APPLIED")
                            : s.action_kind === "extension_request" && waiting.extension
                              ? t("PLAN_ASKED")
                              : s.fallback_for
                                ? t("PLAN_IF_NEEDED", { date: shortDate(s.when) })
                                : t("PLAN_NOW")}
                        </Stamp>
                        <span className="num text-sm text-ink-2">{bdt(s.amount)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              {untrimmed != null && untrimmed > plan.need.amount && (
                <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-rule pt-3 text-ink">
                  <dt className="whitespace-nowrap">
                    {t("PLAN_BORROW_ALL")} <span className="num">{bdt(untrimmed)}</span>
                  </dt>
                  <dd className="num text-right">{bdt(plan.naive_cost_bdt)}</dd>
                  <dt className="font-semibold">{t("PLAN_THIS")}</dt>
                  <dd className="num text-right font-bold">
                    {bdt(plan.plan.total_cost_bdt)}
                    {hasFallback && fallback && fallback.cost_bdt !== plan.plan.total_cost_bdt && (
                      <>
                        <span className="hidden sm:inline"> · </span>
                        <span className="block text-sm font-normal whitespace-nowrap text-ink-2 sm:inline sm:text-base sm:font-bold sm:text-ink">
                          {t("PLAN_WITH_LOAN", { amount: bdt(fallback.cost_bdt!) })}
                        </span>
                      </>
                    )}
                  </dd>
                </dl>
              )}
              <Button size="lg" className="mt-4 w-full sm:w-auto" disabled={busy || !!alreadyProposed} onClick={proposePlan}>
                {inActions ? t("PLAN_IN_APPROVALS") : waitingStep ? t("PLAN_WAITING") : t("PLAN_ADD")}
              </Button>
              {inActions && (
                <Link href="/actions" className="mt-2 inline-flex items-center gap-1 font-semibold text-cash hover:underline sm:ml-3">
                  {t("PLAN_GO_APPROVALS")} <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </Carton>
          </div>

          <details className="group lg:col-span-12">
            <summary className="flex h-12 cursor-pointer list-none items-center justify-center gap-1.5 rounded-full border border-rule bg-board font-semibold text-cash hover:bg-cash-tint [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">{t("PLAN_SEE_ALL")}</span>
              <span className="hidden group-open:inline">{t("PLAN_HIDE_ALL")}</span>
            </summary>
            <Carton tone="ink" title={t("PLAN_ALL")} aside={t("PLAN_CHEAPEST")} bodyClassName="p-0" className="mt-4">
              <ul className="divide-y divide-rule lg:grid lg:grid-cols-2 lg:divide-y-0">
                {plan.options.map((o) => (
                  <li key={o.key} className={`p-4 lg:border-b lg:border-rule ${o.eligible ? "" : "opacity-75"}`}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${o.eligible ? "bg-stock-tint text-stock" : "bg-muted text-ink-2"}`}
                        aria-label={o.eligible ? t("PLAN_AVAILABLE") : t("PLAN_NOT_AVAILABLE")}
                      >
                        {o.eligible ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{o.label}</p>
                        <p className="text-sm text-ink-2">
                          {o.provider} · {o.speed}
                          {o.certainty === "uncertain" ? ` · ${t("PLAN_NOT_SURE")}` : ""}
                        </p>
                        {!o.eligible && <p className="mt-1 text-sm text-ink">{o.reason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="num font-bold text-ink">{o.cost_bdt === null ? "—" : o.cost_bdt === 0 ? t("PLAN_FREE") : bdt(o.cost_bdt)}</p>
                        {o.apr_pct !== null && <p className="num text-xs text-ink-2">{t("PLAN_A_YEAR", { pct: pct(o.apr_pct) })}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Carton>
            {catalogue && <Catalogue c={catalogue} />}
          </details>
        </div>
      )}
    </div>
  );
}

/** Sourced Bangladeshi financing products matched to the need (CORE-14). */
function Catalogue({ c }: { c: CatalogueOut }) {
  const { t } = useStrings();
  return (
    <Carton
      tone="ink"
      title={t("PLAN_OTHER_LOANS")}
      aside={t("PLAN_FOUND", { n: c.matched, m: c.eligible })}
      className="mt-4"
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-rule border-t border-rule">
        {c.options.map((o) => (
          <li key={o.key} className={`p-4 ${o.eligible ? "" : "opacity-75"}`}>
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${o.eligible ? "bg-stock-tint text-stock" : "bg-muted text-ink-2"}`}
                aria-label={o.eligible ? t("PLAN_QUALIFY") : t("PLAN_NOT_QUALIFY")}
              >
                {o.eligible ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{o.label}</p>
                <p className="text-sm text-ink-2">
                  {o.provider_type} · {o.speed_days === 0 ? t("PLAN_SAME_DAY") : t("PLAN_ABOUT_DAYS", { n: o.speed_days })}
                </p>
                {!o.eligible && o.ineligible_reason && <p className="mt-1 text-sm font-semibold text-ink">{o.ineligible_reason}</p>}
                {o.to_confirm.length > 0 && <p className="mt-1 text-sm text-ink-2">{t("PLAN_NEED_DOCS", { list: o.to_confirm.join(", ") })}</p>}
                <a href={o.source} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-cash hover:underline">
                  {t("PLAN_SOURCE")} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
              <div className="text-right">
                <p className="num font-bold text-ink">{o.cost_of_gap_bdt == null ? "—" : bdt(o.cost_of_gap_bdt)}</p>
                {o.apr_pct != null && <p className="num text-xs text-ink-2">{t("PLAN_A_YEAR", { pct: pct(o.apr_pct) })}</p>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Carton>
  );
}
