"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { useCustomers } from "@/lib/api";
import { bdt, shortDate } from "@/lib/format";
import type { PatientDue } from "@/lib/types";
import { useStrings, type StringKey } from "@/lib/strings";

type T = (key: StringKey, vars?: Record<string, string | number>) => string;

function planText(c: PatientDue, t: T) {
  if (!c.plan) return null;
  const date = shortDate(c.plan.first_on);
  return c.plan.parts === 1 ? t("CUST_ALL_ON", { date }) : t("CUST_PARTS_FROM", { n: c.plan.parts, date });
}

async function copyLink(code: string, t: T) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/me/${code}`);
    toast.success(t("CUST_COPIED"));
  } catch {
    toast.error(t("CUST_COPY_ERROR", { code }));
  }
}

/** Customers who owe the pharmacy. Each one has a card (/me/<code>) to see their own amount and set a plan. */
export default function CustomersPage() {
  const { data, error } = useCustomers();
  const total = data?.reduce((s, c) => s + c.amount, 0) ?? 0;
  const planned = data?.filter((c) => c.plan).length ?? 0;
  const { t } = useStrings();

  return (
    <div>
      <PageTitle title={t("NAV_CUSTOMERS")} />
      {error && <LoadError what="your customers" />}
      {!data && !error && <Skel className="h-80" />}
      {data && (
        <Carton tone="ink" title={t("CUST_OWED")} aside={t("CUST_ON_PLAN", { amount: bdt(total), a: planned, b: data.length })}>
          <ul className="divide-y divide-rule">
            {data.map((c) => (
              <li key={c.code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 py-3 sm:flex sm:flex-wrap sm:gap-x-4">
                <div className="min-w-0 sm:min-w-40 sm:flex-1">
                  <p className="font-semibold text-ink">{c.label}</p>
                  <p className="text-sm text-ink-2">{t("CUST_SINCE", { date: shortDate(c.since), n: c.days_outstanding })}</p>
                </div>
                <p className="num text-right font-bold text-ink sm:w-28">{bdt(c.amount)}</p>
                <div className="sm:w-40">
                  {c.plan ? (
                    <Stamp tone="stock">{planText(c, t)}</Stamp>
                  ) : (
                    <Stamp tone={c.days_outstanding > 30 ? "alert" : "warn"}>{t("CUST_NO_PLAN")}</Stamp>
                  )}
                </div>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => copyLink(c.code, t)}
                    aria-label={t("CUST_COPY")}
                    title={t("CUST_COPY")}
                    className="inline-flex size-9 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-rule text-sm font-semibold text-ink hover:bg-muted sm:w-auto sm:px-2.5"
                  >
                    <Copy className="size-4" aria-hidden /> <span className="hidden sm:inline">{t("CUST_COPY")}</span>
                  </button>
                  <Link
                    href={`/me/${c.code}`}
                    aria-label={t("CUST_OPEN", { name: c.label })}
                    className="inline-flex size-9 items-center justify-center rounded-[var(--radius)] border border-rule text-ink hover:bg-muted"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Carton>
      )}
    </div>
  );
}
