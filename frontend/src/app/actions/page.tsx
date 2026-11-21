"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Carton, LoadError, PageTitle, Skel, Stamp } from "@/components/carton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PinPrompt } from "@/components/pin-gate";
import { ApiError, decideAction, errorDetail, useActions, usePause, useValue } from "@/lib/api";
import { bdt } from "@/lib/format";
import { useStrings, type StringKey } from "@/lib/strings";
import type { ActionOut } from "@/lib/types";

const KIND: Record<ActionOut["kind"], StringKey> = {
  return_claim: "KIND_RETURN",
  trim_order: "KIND_TRIM",
  extension_request: "KIND_EXTENSION",
  loan_application: "KIND_LOAN",
  set_aside: "KIND_SET_ASIDE",
};

/** The step's own description: the owner's carry `summary`, LaMP's carry `reason`. */
function title(a: ActionOut, kindLabel: string): string {
  const p = a.payload as Record<string, unknown>;
  return String(p.summary ?? p.reason ?? kindLabel);
}

export default function ActionsPage() {
  const { data: actions, error } = useActions();
  const [busy, setBusy] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<ActionOut | null>(null);
  const paused = !!usePause().data?.paused;
  const { data: value } = useValue();
  const { t } = useStrings();
  const name = (a: ActionOut) => title(a, t(KIND[a.kind]));
  /** While paused, what LaMP proposed can't be approved (the API refuses it too). */
  const held = (a: ActionOut) => paused && a.proposed_by !== "owner";
  const waiting = actions?.filter((a) => a.status === "proposed") ?? [];
  const done = actions?.filter((a) => a.status !== "proposed") ?? [];

  /** Returns false for a wrong PIN and the message for a PIN lockout, so the PIN prompt can say so. */
  async function decide(a: ActionOut, decision: "approve" | "reject", pin?: string): Promise<boolean | string> {
    if (decision === "approve" && a.requires_pin && !pin) {
      setPinFor(a);
      return true;
    }
    setBusy(a.id);
    try {
      const res = await decideAction(a.id, decision, pin);
      setPinFor(null);
      if (res.status === "failed") toast.error(String(res.result?.summary ?? t("APPR_DIDNT_GO")));
      else if (decision === "approve") toast.success(String(res.result?.summary ?? t("APPROVED")));
      else toast(t("APPR_DECLINED_TOAST"));
      return true;
    } catch (e) {
      if (pin && e instanceof ApiError && e.status === 401) return false;
      if (pin && e instanceof ApiError && e.status === 429) return errorDetail(e, t("APPR_TOO_MANY"));
      setPinFor(null);
      toast.error(e instanceof ApiError && e.status === 409 ? errorDetail(e, t("APPR_REFUSED")) : t("APPR_NO_REACH"));
      return true;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageTitle title={t("NAV_APPROVALS")} />
      {error && <LoadError what="your approvals" />}
      {!actions && !error && <Skel className="h-64" />}
      {actions && (
        <div className="space-y-4">
          <Carton tone="warn" title={t("APPR_WAITING")} aside={`${waiting.length}`}>
            {waiting.length === 0 ? (
              <p className="text-ink-2">{t("APPR_CAUGHT_UP")}</p>
            ) : (
              <ul className="divide-y divide-rule">
                {waiting.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-ink-2">
                      {t(KIND[a.kind])}
                      {a.requires_pin && ` · ${t("APPR_NEEDS_PIN")}`}
                    </p>
                    <p className="mt-0.5 font-semibold text-ink sm:text-lg">{name(a)}</p>
                    {/* The amount, unless the step already says it */}
                    {a.payload.amount !== undefined && !name(a).includes(bdt(Number(a.payload.amount))) && (
                      <p className="num mt-0.5 font-bold text-ink">{bdt(Number(a.payload.amount))}</p>
                    )}
                    <div className="mt-2.5 flex gap-2">
                      <Button className="flex-1 sm:flex-none" disabled={busy === a.id || held(a)} onClick={() => decide(a, "approve")}>
                        {t("APPROVE")}
                      </Button>
                      <Button variant="outline" className="flex-1 sm:flex-none" disabled={busy === a.id} onClick={() => decide(a, "reject")}>
                        {t("DECLINE")}
                      </Button>
                    </div>
                    {held(a) && <p className="mt-2 text-sm text-ink-2">{t("APPR_PAUSED")}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Carton>

          <Dialog open={!!pinFor} onOpenChange={(open) => !open && setPinFor(null)}>
            <DialogContent showCloseButton={false} className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{t("APPR_WITH_PIN")}</DialogTitle>
              </DialogHeader>
              {pinFor && (
                <PinPrompt
                  title={`${name(pinFor)}${pinFor.payload.amount !== undefined ? ` · ${bdt(Number(pinFor.payload.amount))}` : ""}`}
                  onSubmit={(pin) => decide(pinFor, "approve", pin)}
                  onCancel={() => setPinFor(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <Carton tone="ink" title={t("APPR_DONE")} aside={`${done.length}`}>
            {done.length === 0 ? (
              <p className="text-ink-2">{t("APPR_NONE_DONE")}</p>
            ) : (
              <ul className="divide-y divide-rule">
                {done.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{name(a)}</p>
                      {a.result?.summary && <p className="text-sm text-ink-2">{String(a.result.summary)}</p>}
                    </div>
                    {a.status === "executed" && <Stamp approved>{t("APPROVED")}</Stamp>}
                    {a.status === "rejected" && <Stamp>{t("DECLINED")}</Stamp>}
                    {a.status === "failed" && <Stamp tone="alert">{t("APPR_NOT_DONE")}</Stamp>}
                  </li>
                ))}
              </ul>
            )}
          </Carton>

          {value && value.items.length > 0 && (
            <Carton tone="stock" title={t("APPR_SAVED")} aside={bdt(value.total)}>
              <ul className="divide-y divide-rule">
                {value.items.map((v) => (
                  <li key={`${v.action_id}-${v.kind}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{v.label}</p>
                    </div>
                    <span className="num font-bold text-stock">{bdt(v.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-rule pt-3 text-sm text-ink-2">
                {t("APPR_TOTAL")} <span className="num font-bold text-ink">{bdt(value.total)}</span>
              </p>
            </Carton>
          )}
        </div>
      )}
    </div>
  );
}
