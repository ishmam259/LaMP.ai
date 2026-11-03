"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { grantConsent, useConsents, useLenders, usePassport, withdrawConsent } from "@/lib/api";
import { num, shortDate } from "@/lib/format";

const SUMMARY = ["passport.summary"];
const FULL = ["passport.summary", "passport.evidence"];

export default function PassportPage() {
  const { data: passport, error } = usePassport();
  const { data: lenders } = useLenders();
  const { data: consents } = useConsents();
  const [busy, setBusy] = useState<string | null>(null);
  const [withEvidence, setWithEvidence] = useState(true);
  const scopes = withEvidence ? FULL : SUMMARY;

  async function toggle(lenderId: string, on: boolean) {
    setBusy(lenderId);
    try {
      if (on) {
        await grantConsent(lenderId, scopes);
        toast.success("Shared.");
      } else {
        const c = consents?.find((x) => x.lender_id === lenderId);
        if (c) await withdrawConsent(c.id);
        toast("Stopped sharing.");
      }
    } catch {
      toast.error("Couldn't change sharing. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageTitle title="Credit record" />
      {error && <LoadError what="your credit record" />}
      {!passport && !error && <Skel className="h-80" />}
      {passport && (
        <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0">
          <div className="space-y-4 lg:col-span-7">
            <Carton tone="stock" title="Your record" aside="Last 3 months">
              <p className="text-ink">
                You paid <span className="num text-[1.75rem] font-bold">{passport.paid_on_time}</span>
                <span className="text-ink-2"> of </span>
                <span className="num font-bold">{passport.invoices_total}</span> supplier invoices on time.
              </p>
              <ol className="mt-3 flex flex-wrap gap-1" aria-label="Each invoice, oldest first">
                {passport.evidence.map((e) => (
                  <li
                    key={e.invoice_no}
                    title={`${e.invoice_no} · ${e.supplier} · due ${shortDate(e.due_date)} · ${e.on_time ? "on time" : "late"}`}
                    className={`size-5 rounded-[3px] ${e.on_time ? "bg-stock" : "bg-alert"}`}
                  >
                    <span className="sr-only">{`${e.invoice_no} ${e.on_time ? "on time" : "late"}`}</span>
                  </li>
                ))}
              </ol>
            </Carton>

            <Carton tone="ink" title="What a lender would offer">
              <dl className="grid grid-cols-2 divide-x divide-rule">
                <div className="pr-4">
                  <dt className="text-sm text-ink-2">A lender would pay</dt>
                  <dd className="num text-[1.75rem] font-bold text-ink">{num(passport.advance_rate_pct, 1)}%</dd>
                  <dd className="text-sm text-ink-2">of each order</dd>
                </div>
                <div className="pl-4">
                  <dt className="text-sm text-ink-2">Chance of not repaying</dt>
                  <dd className="num text-[1.75rem] font-bold text-ink">{num(passport.default_probability * 100, 1)}%</dd>
                </div>
              </dl>
            </Carton>
          </div>

          <div className="lg:col-span-5">
            <Carton tone="warn" title="Who can see it">
              <ul className="divide-y divide-rule">
                {lenders?.map((l) => {
                  const on = !!consents?.some((c) => c.lender_id === l.id);
                  return (
                    <li key={l.id} className="flex items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{l.name}</p>
                        <p className="text-sm text-ink-2">{l.products.map((p) => p.label).join(" · ")}</p>
                        {on && <Stamp tone="stock" className="mt-1.5">Sharing</Stamp>}
                      </div>
                      <Switch
                        checked={on}
                        disabled={busy === l.id}
                        onCheckedChange={(v: boolean) => toggle(l.id, v)}
                        aria-label={`Share your credit record with ${l.name}`}
                      />
                    </li>
                  );
                })}
              </ul>
              <fieldset className="mt-3 border-t border-rule pt-3">
                <legend className="float-left w-full text-sm font-semibold text-ink">What a lender sees</legend>
                <div className="clear-left grid gap-2 pt-2 sm:grid-cols-2">
                  {[
                    { v: false, label: "Summary only" },
                    { v: true, label: "Summary and invoices" },
                  ].map((o) => (
                    <label
                      key={o.label}
                      className={`cursor-pointer rounded-[var(--radius)] border p-2.5 text-sm ${withEvidence === o.v ? "border-cash bg-muted" : "border-rule"}`}
                    >
                      <input type="radio" name="scope" className="sr-only" checked={withEvidence === o.v} onChange={() => setWithEvidence(o.v)} />
                      <span className="block font-semibold text-ink">{o.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </Carton>
          </div>
        </div>
      )}
    </div>
  );
}
