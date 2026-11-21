"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, ChevronRight, Compass, CreditCard, ScrollText, ShieldCheck, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Carton, LoadError, Skel, Stamp } from "@/components/carton";
import { CashLine } from "@/components/cash-line";
import { startGuide } from "@/components/guide";
import { ThemeToggle } from "@/components/theme";
import { LocaleToggle } from "@/components/locale";
import { useStrings, type StringKey } from "@/lib/strings";
import { dayAmount, dayLabel, isNamedMove } from "@/lib/forecast";
import { useAccount, useAccounts, useActions, useAlerts, useDues, useExpiry, useForecast, usePharmacy } from "@/lib/api";
import { ACTION_LABEL, bdt, dayDate, daysBetween, num, shortDate, signed, weekday } from "@/lib/format";
import { waitingOn } from "@/lib/waiting";

export default function TodayPage() {
  const { data: pharmacy } = usePharmacy();
  const { data: forecast, error: fErr } = useForecast();
  const { data: dues } = useDues();
  const { data: expiry } = useExpiry();
  const { data: accounts } = useAccounts();
  const { data: actions } = useActions();
  const { data: alerts } = useAlerts();
  const { data: account } = useAccount();
  const waiting = waitingOn(actions, account);
  const { t } = useStrings();

  const asOf = pharmacy?.settings.as_of_date;
  const short = forecast?.shortfalls[0];
  const pending = actions?.filter((a) => a.status === "proposed") ?? [];
  const suspicious = alerts?.find((a) => a.kind === "suspicious_document");
  const last = forecast?.days[forecast.days.length - 1]?.date;
  const moves = forecast?.days.filter(isNamedMove) ?? [];
  const shown = moves.slice(0, 3);
  const moreCount = moves.length - shown.length;
  const balanceBefore = short && forecast ? forecast.days[forecast.days.findIndex((d) => d.date === short.date) - 1]?.balance : undefined;

  // Shown right under the cash card on phones, and at the top of the side column on desktop.
  const waitingCard = (className: string) =>
    pending.length > 0 && (
      <Carton tone="warn" title={t("TODAY_WAITING")} aside={t("TODAY_TO_APPROVE", { n: pending.length })} className={className}>
        <ul className="divide-y divide-rule">
          {pending.slice(0, 2).map((a) => (
            <li key={a.id} className="py-2 text-ink first:pt-0">
              <span className="block font-semibold">{String(a.payload.summary ?? (a.payload as Record<string, unknown>).reason ?? ACTION_LABEL[a.kind])}</span>
            </li>
          ))}
        </ul>
        <Link href="/actions" className={buttonVariants({ variant: "outline", className: "mt-3 w-full" })}>
          {t("TODAY_REVIEW")} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Carton>
    );

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0">
      <header className="flex items-center justify-between gap-3 lg:col-span-12">
        <h1 className="display text-[1.75rem] leading-tight font-semibold text-ink sm:text-[2rem] lg:text-[2.5rem]">{t("NAV_TODAY")}</h1>
        {asOf && <Stamp className="text-[0.8125rem]">{dayDate(asOf)}</Stamp>}
      </header>

      {suspicious && (
        <p role="alert" className="rounded-2xl border border-alert/30 bg-alert-tint p-4 font-semibold text-alert lg:col-span-12">
          {suspicious.title}
        </p>
      )}

      {/* Cash: the first thing the owner reads, on the station board */}
      <div className="space-y-4 lg:col-span-7">
        {!forecast && !fErr && <Skel className="h-72" />}
        {fErr && <LoadError what="your cash" />}
        {forecast && (
          <>
            <section aria-labelledby="board-head" className="station-board" data-guide="today">
              {short ? (
                <>
                  {waiting.covered && (
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-stock">
                      <Check className="size-4" aria-hidden /> {t("TODAY_COVERED")}
                    </p>
                  )}
                  <h2 id="board-head" className="sb-head">
                    <span className="num text-alert">
                      <span className="sr-only">Cash: </span>{t("TODAY_SHORT")} <span className="display-accent text-alert">{bdt(short.amount)}</span>
                    </span>
                    <span className="sb-time">
                      {dayDate(short.date)}
                      {asOf ? ` · ${relDay(daysBetween(asOf, short.date), t)}` : ""}
                    </span>
                  </h2>
                  <p className="sb-sub mt-3 font-medium sm:text-[1.0625rem]">
                    {short.cause}
                    {balanceBefore !== undefined && <> · {t("TODAY_YOULL_HAVE", { amount: bdt(balanceBefore) })}</>}
                  </p>
                </>
              ) : (
                <h2 id="board-head" className="sb-head">
                  <span className="text-stock">
                    {t("TODAY_HOLDS_1")} <span className="display-accent text-stock">{t("TODAY_HOLDS_2")}</span> {t("TODAY_HOLDS_3")}
                  </span>
                </h2>
              )}
              <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                {short && (
                  <Link href="/funding" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
                    {t("TODAY_SEE_PLAN")} <ArrowRight className="size-5" aria-hidden />
                  </Link>
                )}
                <Link href="/cash" className="hidden h-11 items-center lg:inline-flex justify-center gap-1 rounded-full px-3 font-semibold text-cash hover:bg-cash-tint">
                  {t("TODAY_CASH_DAILY")} <ArrowRight className="size-4" aria-hidden />
                </Link>
                {waiting.loan && (
                  <Link href="/funding" className="inline-flex h-11 items-center justify-center text-sm font-semibold text-warn hover:underline">
                    {t("TODAY_LOAN_WAITING")}
                  </Link>
                )}
              </div>
            </section>
            {waitingCard("lg:hidden")}
            <Carton
              tone="ink"
              title={t("TODAY_COMING_UP")}
              aside={shown.length > 0 ? `${shortDate(shown[0].date)} – ${shortDate(shown[shown.length - 1].date)}` : undefined}
            >
              <CashLine forecast={forecast} />
              <ul className="mt-3 divide-y divide-rule">
                {shown.map((d) => {
                  // The engine's own shortfall for this day, so the row matches the board.
                  const gap = forecast.shortfalls.find((x) => x.date === d.date);
                  const neg = !!gap || d.balance < 0;
                  const amount = dayAmount(d);
                  return (
                    <li key={d.date} className={`grid grid-cols-[64px_1fr_auto] items-center gap-3 py-2.5 ${neg ? "-mx-3 rounded-xl bg-alert-tint px-3" : ""}`}>
                      <span className="leading-tight font-bold text-ink">
                        {shortDate(d.date)}
                        <span className="block text-xs font-semibold text-ink-2">{weekday(d.date)}</span>
                      </span>
                      <span className="min-w-0 truncate text-ink">
                        {dayLabel(d, dues?.items.find((x) => x.due_date === d.date)?.supplier)}
                      </span>
                      <span className="text-right">
                        <span className={`num block font-bold ${amount > 0 ? "text-stock" : "text-ink"}`}>{signed(amount)}</span>
                        {gap && (
                          <span className="num block text-sm font-semibold whitespace-nowrap text-alert">
                            {gap.date === short?.date ? t("TODAY_SHORT_N", { n: num(gap.amount) }) : t("TODAY_MORE_SHORT", { n: num(gap.amount) })}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {moreCount > 0 && last && (
                <Link href="/cash" className="mt-1 flex items-center justify-between gap-2 border-t border-rule pt-3 font-semibold text-cash hover:underline">
                  <span>{t("TODAY_MORE_BEFORE", { n: moreCount, date: shortDate(last) })}</span>
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </Carton>
          </>
        )}
      </div>

      <div className="space-y-4 lg:col-span-5">
        {waitingCard("hidden lg:block")}

        {/* Expiring stock */}
        <Carton tone="ink" title={t("TODAY_EXPIRING")} aside={t("TODAY_NEXT_60")}>
          {!expiry ? (
            <Skel className="h-24" />
          ) : (
            <>
              <p className="num display text-[2rem] leading-tight font-bold text-ink">{bdt(expiry.at_risk_value)}</p>
              <p className="mt-1 text-ink">
                {t("TODAY_BATCHES_BACK", { n: expiry.batches.length, amount: bdt(expiry.return_eligible_value) })}
              </p>
              <Link href="/stock" className={buttonVariants({ variant: "outline", className: "mt-3 w-full" })}>
                {t("TODAY_GET_BACK", { amount: bdt(expiry.return_eligible_value) })}
              </Link>
            </>
          )}
        </Carton>

        {/* This month */}
        <Carton tone="ink" title={t("TODAY_LAST_30")} className="hidden lg:block">
          {!accounts ? (
            <Skel className="h-16" />
          ) : (
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-sm text-ink-2">{t("TODAY_SALES")}</dt>
                <dd className="num display text-2xl font-bold text-ink">{num(accounts.sales)}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-2">{t("TODAY_COSTS")}</dt>
                <dd className="num display text-2xl font-bold text-ink">{num(accounts.sales - accounts.net_profit)}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-2">{t("TODAY_KEPT")}</dt>
                <dd className="num display text-2xl font-bold text-stock">{num(accounts.net_profit)}</dd>
              </div>
            </dl>
          )}
          <Link href="/cash#accounts" className="mt-3 inline-flex h-11 items-center gap-1 font-semibold text-cash hover:underline">
            {t("TODAY_FULL_ACCOUNTS")} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Carton>
      </div>

      {/* Phone: the screens that aren't in the tab bar */}
      <nav aria-label={t("NAV_MORE")} className="carton lg:hidden">
        <ul className="divide-y divide-rule">
          {(
            [
              { href: "/customers", label: "NAV_CUSTOMERS", icon: Users, guide: "customers" },
              { href: "/passport", label: "NAV_CREDIT", icon: BadgeCheck },
              { href: "/wallet", label: "NAV_WALLET", icon: CreditCard },
              { href: "/rules", label: "NAV_RULES", icon: ShieldCheck },
              { href: "/log", label: "NAV_HISTORY", icon: ScrollText },
            ] as { href: string; label: StringKey; icon: typeof Users; guide?: string }[]
          ).map(({ href, label, icon: Icon, guide }) => (
            <li key={href}>
              <Link href={href} data-guide={guide} className="flex min-h-13 items-center gap-3 px-5 py-2 text-ink hover:bg-muted">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cash-tint text-cash"><Icon className="size-[18px]" aria-hidden /></span>
                <span className="min-w-0 flex-1 font-semibold">{t(label)}</span>
                <ChevronRight className="size-5 shrink-0 text-ink-2" aria-hidden />
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={startGuide} className="flex min-h-13 w-full items-center gap-3 px-5 py-2 text-left text-ink hover:bg-muted">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cash-tint text-cash"><Compass className="size-[18px]" aria-hidden /></span>
              <span className="min-w-0 flex-1 font-semibold">{t("NAV_TOUR")}</span>
              <ChevronRight className="size-5 shrink-0 text-ink-2" aria-hidden />
            </button>
          </li>
          <li className="flex gap-2 px-3 py-1.5">
            <LocaleToggle withIcon className="flex-1 justify-center rounded-xl border border-rule" />
            <ThemeToggle withLabel className="flex-1 justify-center rounded-xl border border-rule" />
          </li>
        </ul>
      </nav>
    </div>
  );
}

function relDay(n: number, t: (key: StringKey, vars?: Record<string, string | number>) => string) {
  if (n === 0) return t("DAY_TODAY");
  if (n === 1) return t("DAY_TOMORROW");
  return n < 0 ? t("DAY_AGO", { n: -n }) : t("DAY_IN", { n });
}
