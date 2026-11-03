"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { useCustomers } from "@/lib/api";
import { bdt, shortDate } from "@/lib/format";
import type { PatientDue } from "@/lib/types";

function planText(c: PatientDue) {
  if (!c.plan) return null;
  return c.plan.parts === 1 ? `All on ${shortDate(c.plan.first_on)}` : `${c.plan.parts} parts from ${shortDate(c.plan.first_on)}`;
}

async function copyLink(code: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/me/${code}`);
    toast.success("Card link copied. Send it to the customer.");
  } catch {
    toast.error(`Couldn't copy. The code is ${code}.`);
  }
}

/** Customers who owe the pharmacy. Each one has a card (/me/<code>) to see their own amount and set a plan. */
export default function CustomersPage() {
  const { data, error } = useCustomers();
  const total = data?.reduce((s, c) => s + c.amount, 0) ?? 0;
  const planned = data?.filter((c) => c.plan).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Customers" />
      {error && <LoadError what="your customers" />}
      {!data && !error && <Skel className="h-80" />}
      {data && (
        <Carton tone="ink" title="Owed to you" aside={`${bdt(total)} · ${planned} of ${data.length} on a plan`}>
          <ul className="divide-y divide-rule">
            {data.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-40 flex-1">
                  <p className="font-semibold text-ink">{c.label}</p>
                  <p className="text-sm text-ink-2">
                    Since {shortDate(c.since)}, {c.days_outstanding} days
                  </p>
                </div>
                <p className="num w-28 text-right font-bold text-ink">{bdt(c.amount)}</p>
                <div className="w-40">
                  {c.plan ? (
                    <Stamp tone="stock">{planText(c)}</Stamp>
                  ) : (
                    <Stamp tone={c.days_outstanding > 30 ? "alert" : "warn"}>No plan yet</Stamp>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => copyLink(c.code)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-rule px-2.5 text-sm font-semibold text-ink hover:bg-muted"
                  >
                    <Copy className="size-4" aria-hidden /> Copy card link
                  </button>
                  <Link
                    href={`/me/${c.code}`}
                    aria-label={`Open ${c.label}'s card`}
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
