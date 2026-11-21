"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { grantConsent, useConsents, useLenders, usePassport, withdrawConsent } from "@/lib/api";
import { num, shortDate } from "@/lib/format";
import { useStrings } from "@/lib/strings";

const SUMMARY = ["passport.summary"];
const FULL = ["passport.summary", "passport.evidence"];

export default function PassportPage() {
  const { data: passport, error } = usePassport();
  const { data: lenders } = useLenders();
  const { data: consents } = useConsents();
  const [busy, setBusy] = useState<string | null>(null);
  const [withEvidence, setWithEvidence] = useState(true);
  const scopes = withEvidence ? FULL : SUMMARY;
  const { t } = useStrings();

  async function toggle(lenderId: string, on: boolean) {
    setBusy(lenderId);
    try {
      if (on) {
        await grantConsent(lenderId, scopes);
        toast.success(t("CREDIT_SHARED"));
      } else {
        const c = consents?.find((x) => x.lender_id === lenderId);
        if (c) await withdrawConsent(c.id);
        toast(t("CREDIT_STOPPED"));
      }
    } catch {
      toast.error(t("CREDIT_ERROR"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageTitle title={t("NAV_CREDIT")} />
      {error && <LoadError what="your credit record" />}
      {!passport && !error && <Skel className="h-80" />}
      {passport && (
        <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0">
          <div className="space-y-4 lg:col-span-7">
            <Carton tone="stock" title={t("CREDIT_RECORD")} aside={t("CREDIT_3_MONTHS")}>
              <p className="text-ink">
                {t("CREDIT_PAID")} <span className="num display text-[2rem] leading-tight font-bold">{passport.paid_on_time}</span>
                <span className="text-ink-2"> {t("CREDIT_OF")} </span>
                <span className="num font-bold">{passport.invoices_total}</span> {t("CREDIT_ON_TIME")}
              </p>
              <ol className="mt-3 flex flex-wrap gap-1" aria-label={t("CREDIT_EACH")}>
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

            <Carton tone="ink" title={t("CREDIT_LENDER_OFFER")}>
              <dl className="grid grid-cols-2 divide-x divide-rule">
                <div className="pr-4">
                  <dt className="text-sm text-ink-2">{t("CREDIT_WOULD_PAY")}</dt>
                  <dd className="num display text-[2rem] leading-tight font-bold text-ink">{num(passport.advance_rate_pct, 1)}%</dd>
                  <dd className="text-sm text-ink-2">{t("CREDIT_EACH_ORDER")}</dd>
                </div>
                <div className="pl-4">
                  <dt className="text-sm text-ink-2">{t("CREDIT_NOT_REPAY")}</dt>
                  <dd className="num display text-[2rem] leading-tight font-bold text-ink">{num(passport.default_probability * 100, 1)}%</dd>
                </div>
              </dl>
            </Carton>
          </div>

          <div className="lg:col-span-5">
            <Carton tone="ink" title={t("CREDIT_WHO")}>
              <ul className="divide-y divide-rule">
                {lenders?.map((l) => {
                  const on = !!consents?.some((c) => c.lender_id === l.id);
                  return (
                    <li key={l.id} className="flex items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{l.name}</p>
                        <p className="text-sm text-ink-2">{l.products.map((p) => p.label).join(" · ")}</p>
                        {on && <Stamp tone="stock" className="mt-1.5">{t("CREDIT_SHARING")}</Stamp>}
                      </div>
                      <Switch
                        checked={on}
                        disabled={busy === l.id}
                        onCheckedChange={(v: boolean) => toggle(l.id, v)}
                        aria-label={t("CREDIT_SHARE_WITH", { name: l.name })}
                      />
                    </li>
                  );
                })}
              </ul>
              <fieldset className="mt-3 border-t border-rule pt-3">
                <legend className="float-left w-full text-sm font-semibold text-ink">{t("CREDIT_SEES")}</legend>
                <div className="clear-left grid grid-cols-2 gap-2 pt-2">
                  {[
                    { v: false, label: t("CREDIT_SUMMARY") },
                    { v: true, label: t("CREDIT_FULL") },
                  ].map((o) => (
                    <label
                      key={o.label}
                      className={`flex min-h-14 cursor-pointer items-center justify-center rounded-[var(--radius)] border-2 px-3 py-2 text-center font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring ${withEvidence === o.v ? "border-cash bg-cash-tint text-cash" : "border-rule text-ink hover:border-ink-2"}`}
                    >
                      <input type="radio" name="scope" className="sr-only" checked={withEvidence === o.v} onChange={() => setWithEvidence(o.v)} />
                      <span>{o.label}</span>
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
