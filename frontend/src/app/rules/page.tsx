"use client";

import { Check, ExternalLink, KeyRound } from "lucide-react";
import { Carton, LoadError, PageTitle, Skel } from "@/components/carton";
import { PauseToggle } from "@/components/pause";
import { usePolicy } from "@/lib/api";
import { num } from "@/lib/format";
import type { ActionKind } from "@/lib/types";
import { useStrings, type StringKey } from "@/lib/strings";

const KIND: Record<ActionKind, StringKey> = {
  return_claim: "RULE_RETURN",
  extension_request: "RULE_EXTENSION",
  loan_application: "RULE_LOAN",
  set_aside: "RULE_SET_ASIDE",
  trim_order: "RULE_TRIM",
};

/** Read-only view of the rules LaMP enforces (CORE-07): Pause, the PIN, the borrowing ceiling. */
export default function RulesPage() {
  const { data: p, error } = usePolicy();
  const { t } = useStrings();
  return (
    <div>
      <PageTitle title={t("NAV_RULES")} />
      {error && <LoadError what="the rules" />}
      {!p && !error && <Skel className="h-96" />}
      {p && (
        <div className="space-y-4">
          <Carton tone={p.paused ? "warn" : "ink"} title={t("RULES_PAUSE")} aside={p.paused ? t("PAUSED") : t("RUNNING")}>
            <div>
              <PauseToggle />
            </div>
          </Carton>

          <Carton tone="ink" title={t("RULES_YOUR_APPROVAL")}>
            <ul className="space-y-2 text-ink">
              {(Object.keys(KIND) as ActionKind[]).map((k) => {
                const pin = p.pin_required_for.includes(k);
                return (
                  <li key={k} className="flex items-center gap-2">
                    {pin ? <KeyRound className="size-4 shrink-0 text-warn" aria-hidden /> : <Check className="size-4 shrink-0 text-stock" aria-hidden />}
                    <span className="flex-1">{t(KIND[k])}</span>
                    {pin && <span className="text-sm text-ink-2">{t("RULES_PIN")}</span>}
                  </li>
                );
              })}
            </ul>
          </Carton>

          <Carton tone="ink" title={t("RULES_LIMIT")} aside={t("RULES_LIMIT_PCT", { pct: num(p.dbr_cap_pct) })}>
            <a href={p.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-cash hover:underline">
              {t("RULES_SOURCE", { issuer: p.source.issuer })} <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Carton>
        </div>
      )}
    </div>
  );
}
