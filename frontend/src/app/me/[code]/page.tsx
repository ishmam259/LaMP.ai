"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Carton, Skel, Stamp } from "@/components/carton";
import { ApiError, errorDetail, setPlan, useCard } from "@/lib/api";
import { bdt, dayDate, shortDate } from "@/lib/format";
import type { PatientCard, PlanParts } from "@/lib/types";

function optionLabel(parts: PlanParts, partAmount: number, total: number) {
  return parts === 1 ? `All at once: ${bdt(total)}` : `${parts} weekly parts of ${bdt(partAmount)}`;
}

/** The customer's own card: what they owe, and a payment plan they choose. */
export default function CustomerCard() {
  const { code } = useParams<{ code: string }>();
  const { data: card, error } = useCard(decodeURIComponent(code));
  const [editing, setEditing] = useState(false);

  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="carton p-4">
        <h1 className="text-xl font-bold text-ink">{missing ? "We couldn't find that card" : "Couldn't load your card"}</h1>
        <p className="mt-2 text-ink-2">
          {missing ? "Check the code on your slip from the pharmacy and try again." : "Check your connection and try again."}
        </p>
        <Link href="/me" className="mt-3 inline-block font-semibold text-cash underline underline-offset-2">
          Enter a code
        </Link>
      </div>
    );
  }
  if (!card) return <Skel className="h-96" />;

  return (
    <div className="space-y-4">
      <section aria-labelledby="owe">
        <p className="text-sm text-ink-2">
          {card.pharmacy_name}, {card.city} · {card.label}
        </p>
        <h1 id="owe" className="mt-1 text-ink">
          <span className="block text-lg font-semibold">You owe</span>
          <span className="num block font-board text-5xl font-extrabold tracking-tight">{bdt(card.amount)}</span>
        </h1>
        <p className="mt-1 text-ink-2">
          Since {shortDate(card.since)}, {card.days_outstanding} days ago
        </p>
      </section>

      {card.plan && !editing ? (
        <Carton tone="stock" title="Your plan" aside={<Stamp tone="stock">Promised</Stamp>}>
          <ol className="divide-y divide-rule">
            {card.plan.schedule.map((p) => (
              <li key={p.n} className="flex items-center justify-between py-2">
                <span className="text-ink">{dayDate(p.due_on)}</span>
                <span className="num font-bold text-ink">{bdt(p.amount)}</span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setEditing(true)} className="mt-3 font-semibold text-cash underline underline-offset-2">
            Change my plan
          </button>
        </Carton>
      ) : (
        <PlanPicker card={card} code={decodeURIComponent(code)} onDone={() => setEditing(false)} />
      )}
    </div>
  );
}

function PlanPicker({ card, code, onDone }: { card: PatientCard; code: string; onDone: () => void }) {
  const [parts, setParts] = useState<PlanParts>(card.plan?.parts ?? 4);
  const [firstOn, setFirstOn] = useState(card.plan?.first_on ?? card.as_of);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await setPlan(code, parts, firstOn);
      toast.success("Plan saved. The pharmacy can see it now.");
      onDone();
    } catch (e) {
      toast.error(errorDetail(e, "Couldn't save your plan. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Carton tone="warn" title="Pay it back your way">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset>
          <legend className="text-ink">How do you want to pay?</legend>
          <div className="mt-2 space-y-2">
            {card.options.map((o) => (
              <label
                key={o.parts}
                className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-rule p-3 has-[:checked]:border-cash has-[:checked]:bg-muted"
              >
                <input
                  type="radio"
                  name="parts"
                  value={o.parts}
                  checked={parts === o.parts}
                  onChange={() => setParts(o.parts)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="num font-semibold text-ink">{optionLabel(o.parts, o.part_amount, card.amount)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor="first-on" className="mt-4 block text-ink">
          First payment on
        </label>
        <input
          id="first-on"
          type="date"
          value={firstOn}
          min={card.as_of}
          max={card.latest_first_on}
          onChange={(e) => setFirstOn(e.target.value)}
          className="num mt-1 h-11 w-full rounded-[var(--radius)] border border-rule bg-board px-3 text-ink"
        />
        <p className="mt-1 text-xs text-ink-2">
          Any day from {shortDate(card.as_of)} to {shortDate(card.latest_first_on)}.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
        >
          <CalendarCheck className="size-5" aria-hidden /> {busy ? "Saving…" : "Promise this plan"}
        </button>
      </form>
    </Carton>
  );
}
