"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStrings } from "@/lib/strings";

/** A customer types the code from their slip to open their card. */
export default function CustomerHome() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const { t } = useStrings();
  const open = (c: string) => c.trim() && router.push(`/me/${encodeURIComponent(c.trim().toUpperCase())}`);

  return (
    <div>
      <h1 className="display text-[1.75rem] leading-tight font-semibold text-ink sm:text-[2rem]">
        {t("ME_TITLE_1")} <span className="display-accent">{t("ME_TITLE_2")}</span> {t("ME_TITLE_3")}
      </h1>
      <p className="mt-2 text-ink-2">
        {t("ME_ENTER")}
      </p>
      <form
        className="carton mt-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          open(code);
        }}
      >
        <label htmlFor="card-code" className="font-semibold text-ink">
          {t("ME_CODE")}
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
          <button type="submit" className="h-11 rounded-full bg-primary shadow-glow px-4 font-semibold text-primary-foreground">
            {t("ME_OPEN")}
          </button>
        </div>
      </form>
    </div>
  );
}
