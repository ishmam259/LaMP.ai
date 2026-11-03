"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";

const DEMO_CODE = "GL-7KQM-4XPA";

/** A customer types the code from their slip to open their card. */
export default function CustomerHome() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const open = (c: string) => c.trim() && router.push(`/me/${encodeURIComponent(c.trim().toUpperCase())}`);

  return (
    <div>
      <h1 className="font-board text-3xl font-extrabold tracking-tight text-ink">Check what you owe your pharmacy</h1>
      <p className="mt-2 text-ink-2">
        Bought medicine on credit? Your pharmacy gives you a card code. Enter it to see what you owe and pick a way to pay it back
        that fits your week.
      </p>
      <form
        className="carton mt-5 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          open(code);
        }}
      >
        <label htmlFor="card-code" className="font-semibold text-ink">
          Card code
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="card-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="GL-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="num h-11 min-w-0 flex-1 rounded-[var(--radius)] border border-rule bg-board px-3 text-lg tracking-wider text-ink uppercase"
          />
          <button type="submit" className="h-11 rounded-[var(--radius)] bg-primary px-4 font-semibold text-primary-foreground">
            Open
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={() => open(DEMO_CODE)}
        className="mt-4 inline-flex items-center gap-2 font-semibold text-cash underline underline-offset-2"
      >
        <Ticket className="size-4" aria-hidden /> Try a demo card ({DEMO_CODE})
      </button>
    </div>
  );
}
