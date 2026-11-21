"use client";

import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { useAccount } from "@/lib/api";
import { bdt, dayDate, signed, stampDate } from "@/lib/format";
import type { AccountOut, MatchStatus } from "@/lib/types";
import { useStrings, type StringKey } from "@/lib/strings";

const STATUS: Record<MatchStatus, { label: StringKey; tone?: "alert" | "warn" | "stock" }> = {
  matched: { label: "WALLET_MATCHED", tone: "stock" },
  duplicate: { label: "WALLET_TWICE", tone: "alert" },
  unmatched: { label: "WALLET_NO_BILL", tone: "warn" },
  missing_from_statement: { label: "WALLET_NOT_IN", tone: "warn" },
};

const ORDER: MatchStatus[] = ["duplicate", "unmatched", "missing_from_statement", "matched"];

const TXN_KIND: Record<string, StringKey> = { loan_payout: "WALLET_LOAN_IN" };

export default function WalletPage() {
  const { data: account, error } = useAccount();
  const { t } = useStrings();
  return (
    <div>
      <PageTitle title={t("NAV_WALLET")} />
      {error && <LoadError what="your wallet" />}
      {!account && !error && <Skel className="h-96" />}
      {account && <Wallet a={account} />}
    </div>
  );
}

function Wallet({ a }: { a: AccountOut }) {
  const { t } = useStrings();
  const problems = a.matches.filter((m) => m.status !== "matched");
  const rows = [...a.matches].sort((x, y) => ORDER.indexOf(x.status) - ORDER.indexOf(y.status) || x.date.localeCompare(y.date));
  return (
    <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0">
      <div className="space-y-4 lg:col-span-5">
        <Carton tone="cash" title={t("WALLET_BALANCE")}>
          <p className="num display text-[2.5rem] leading-tight font-bold text-ink">{bdt(a.balance)}</p>
          <p className="text-sm text-ink-2">
            {t("WALLET_START")} <span className="num">{bdt(a.opening_balance)}</span>
          </p>
          {a.transactions.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">{t("WALLET_NOTHING")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-rule border-t border-rule">
              {a.transactions.map((tx) => (
                <li key={tx.ref} className="flex items-start gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{TXN_KIND[tx.kind] ? t(TXN_KIND[tx.kind]) : tx.kind.replaceAll("_", " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`num font-bold ${tx.amount >= 0 ? "text-stock" : "text-ink"}`}>{signed(tx.amount)}</p>
                    <Stamp>{stampDate(tx.date)}</Stamp>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carton>

        <Carton tone={problems.length ? "warn" : "stock"} title={t("WALLET_TODO")} aside={problems.length ? t("WALLET_TO_CHECK", { n: problems.length }) : t("WALLET_CLEAR")}>
          {a.recommendations.length === 0 ? (
            <p className="text-ink">{t("WALLET_ALL_MATCH")}</p>
          ) : (
            <ul className="space-y-2 text-ink">
              {a.recommendations.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-warn" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </Carton>
      </div>

      <div className="lg:col-span-7">
        <Carton
          tone="ink"
          title={t("WALLET_VS")}
          aside={ORDER.filter((s) => a.counts[s])
            .map((s) => `${a.counts[s]} ${t(STATUS[s].label).toLowerCase()}`)
            .join(" · ")}
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="num w-full text-sm">
              <thead className="text-left text-ink-2">
                <tr className="border-b border-rule">
                  <th className="hidden px-4 py-2 font-semibold sm:table-cell">{t("WALLET_DATE")}</th>
                  <th className="py-2 pr-2 pl-4 font-semibold sm:pl-2">{t("WALLET_PAID_TO")}</th>
                  <th className="px-2 py-2 text-right font-semibold">{t("WALLET_AMOUNT")}</th>
                  <th className="hidden px-4 py-2 font-semibold sm:table-cell">{t("WALLET_CHECK")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {rows.map((m) => (
                  <tr key={m.ref} className={m.status === "matched" ? "" : "bg-warn-tint/40"}>
                    <td className="hidden px-4 py-2 whitespace-nowrap text-ink sm:table-cell">{dayDate(m.date)}</td>
                    <td className="py-2 pr-2 pl-4 text-ink sm:pl-2">
                      <span className="block text-xs text-ink-2 sm:hidden">{dayDate(m.date)}</span>
                      {m.supplier ?? m.payee}
                      {m.invoice_no && <span className="whitespace-nowrap text-ink-2"> · {m.invoice_no}</span>}
                    </td>
                    <td className="py-2 pr-4 pl-2 text-right align-top font-semibold sm:pr-2 whitespace-nowrap text-ink sm:align-middle">
                      {signed(m.amount)}
                      <span className="mt-1 block sm:hidden">
                        <Stamp tone={STATUS[m.status].tone}>{t(STATUS[m.status].label)}</Stamp>
                      </span>
                    </td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <Stamp tone={STATUS[m.status].tone}>{t(STATUS[m.status].label)}</Stamp>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carton>
      </div>
    </div>
  );
}
