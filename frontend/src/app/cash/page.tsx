"use client";

import Link from "next/link";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { CashLine } from "@/components/cash-line";
import { dayAmount, dayLabel, isNamedMove } from "@/lib/forecast";
import { useAccounts, useDues, useForecast } from "@/lib/api";
import { bdt, dayDate, num, signed, shortDate, stampDate } from "@/lib/format";
import { useStrings } from "@/lib/strings";

export default function CashPage() {
  const { data: forecast, error } = useForecast();
  const { data: dues } = useDues();
  const { data: accounts } = useAccounts();
  const { t } = useStrings();

  const events = forecast?.days.filter(isNamedMove) ?? [];
  const first = forecast?.days[0]?.date;
  const last = forecast?.days[forecast.days.length - 1]?.date;

  return (
    <div>
      <PageTitle title={t("NAV_CASH")} />
      <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0">
        <div className="space-y-4 lg:col-span-7">
          <Carton tone="cash" title={t("CASH_NEXT_30")} aside={first && last ? `${shortDate(first)} – ${shortDate(last)}` : undefined}>
            {error && <LoadError what="your cash" />}
            {!forecast && !error && <Skel className="h-24" />}
            {forecast && (
              <>
                <CashLine forecast={forecast} />
                <p className="num mt-3 text-sm text-ink-2">{t("CASH_YOU_HAVE", { amount: bdt(forecast.start_cash) })}</p>
              </>
            )}
          </Carton>

          <Carton tone="cash" title={t("CASH_IN_OUT")} bodyClassName="p-0">
            {!forecast ? (
              <Skel className="m-4 h-40" />
            ) : (
              <table className="w-full text-left">
                <caption className="sr-only">Money in and out over the next 30 days, and the cash left at the end of each day</caption>
                <thead className="bg-board text-sm font-semibold text-ink-2">
                  <tr className="border-b border-rule">
                    <th scope="col" className="px-4 py-2 font-semibold">{t("CASH_DAY")}</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">{t("CASH_AMOUNT")}</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">{t("CASH_LEFT")}</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {events.map((d) => {
                    const net = dayAmount(d);
                    const neg = d.balance < 0;
                    return (
                      <tr key={d.date} className={neg ? "bg-alert-tint" : "even:bg-shelf/40"}>
                        <th scope="row" className="px-4 py-2.5 font-semibold whitespace-nowrap text-ink">
                          {dayDate(d.date)}
                          <span className="block text-sm font-normal whitespace-normal text-ink-2">
                            <KeepCode text={dayLabel(d, dues?.items.find((x) => x.due_date === d.date)?.supplier)} />
                          </span>
                        </th>
                        <td className={`px-2 py-2.5 text-right font-semibold whitespace-nowrap ${net < 0 ? "text-ink" : "text-stock"}`}>{signed(net)}</td>
                        <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap ${neg ? "text-alert" : "text-ink"}`}>{num(d.balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Carton>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Carton tone="cash" title={t("CASH_BILLS")} aside={dues ? t("CASH_N_BILLS", { n: dues.items.length }) : undefined}>
            {!dues ? (
              <Skel className="h-40" />
            ) : (
              <>
                <ul className="divide-y divide-rule">
                  {dues.items.map((d) => (
                    <li key={d.invoice_no} className="flex items-start gap-3 py-3 first:pt-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{d.supplier}</p>
                        <p className="text-sm text-ink-2">{d.invoice_no.startsWith("PO-") ? t("CASH_ORDER", { no: d.invoice_no.slice(3) }) : t("CASH_INVOICE", { no: d.invoice_no })}</p>
                        <Stamp tone={d.status === "overdue" ? "alert" : d.status === "due_soon" ? "warn" : undefined} className="mt-1.5">
                          {t("CASH_DUE", { date: stampDate(d.due_date) })}
                        </Stamp>
                      </div>
                      <span className="num text-right text-lg font-bold text-ink">{num(d.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t-2 border-ink pt-2 font-bold text-ink">
                  <span>{t("CASH_TOTAL_DUE")}</span>
                  <span className="num">{bdt(dues.total_due)}</span>
                </div>
              </>
            )}
          </Carton>

          <div id="accounts">
            <Carton tone="ink" title={t("CASH_ACCOUNTS")} aside={t("TODAY_LAST_30")}>
              {!accounts ? (
                <Skel className="h-56" />
              ) : (
                <>
                  <dl className="num divide-y divide-rule">
                    {[
                      [t("CASH_SALES"), accounts.sales, ""],
                      [t("CASH_PROFIT", { pct: accounts.gross_margin_pct }), accounts.gross_profit, ""],
                      [t("CASH_RENT"), -accounts.overheads, ""],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="flex justify-between py-2">
                        <dt className="text-ink-2">{label}</dt>
                        <dd className="font-semibold text-ink">{signed(Number(value)).replace("+ ", "")}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between border-t-2 border-ink py-2 text-lg font-bold">
                      <dt className="text-ink">{t("CASH_KEPT")}</dt>
                      <dd className="text-stock">{bdt(accounts.net_profit)}</dd>
                    </div>
                  </dl>
                  <dl className="mt-3 grid grid-cols-2 divide-x divide-rule border-t border-rule pt-3 text-sm">
                    <div className="pr-4">
                      <dt className="text-ink-2">{t("CASH_STOCK")}</dt>
                      <dd className="num font-bold text-ink">{bdt(accounts.stock_value)}</dd>
                      <dd className="text-ink-2">{t("CASH_STOCK_DAYS", { n: Math.round(accounts.stock_days) })}</dd>
                    </div>
                    <div className="pl-4">
                      <dt className="text-ink-2">{t("CASH_CUSTOMERS_OWE")}</dt>
                      <dd className="num font-bold text-ink">{bdt(accounts.patient_dues)}</dd>
                      <dd>
                        <Link href="/customers" className="font-semibold text-cash underline underline-offset-2">
                          {t("CASH_SEE_WHO")}
                        </Link>
                      </dd>
                    </div>
                  </dl>
                  <h3 className="mt-4 font-semibold text-ink">{t("CASH_WHO_YOU_BUY")}</h3>
                  <p className="text-xs text-ink-2">{t("CASH_TOP", { n: accounts.top_suppliers.length, m: accounts.active_suppliers })}</p>
                  <ul className="mt-2 space-y-1.5">
                    {accounts.top_suppliers.map((s) => (
                      <li key={s.name} className="grid grid-cols-[96px_1fr_44px] items-center gap-2 text-sm">
                        <span className="font-semibold text-ink">{s.name}</span>
                        <span className="h-2.5 rounded-full bg-muted" aria-hidden>
                          <span className="block h-full rounded-full bg-ink-2" style={{ width: `${(s.share_pct / 20) * 100}%` }} />
                        </span>
                        <span className="num text-right text-ink">{s.share_pct}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Carton>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Keeps the last word (an invoice code such as "D-20931") on one line instead of breaking at its hyphen. */
function KeepCode({ text }: { text: string }) {
  const cut = text.lastIndexOf(" ");
  if (cut < 0) return <span className="whitespace-nowrap">{text}</span>;
  return (
    <>
      {text.slice(0, cut + 1)}
      <span className="whitespace-nowrap">{text.slice(cut + 1)}</span>
    </>
  );
}
