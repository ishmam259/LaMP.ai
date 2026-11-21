"use client";

import { useEffect } from "react";
import { Languages } from "lucide-react";
import { cn } from "cn";
import { setLocale, useStrings } from "@/lib/strings";
import { BanglaDom } from "@/components/bangla-dom";

/** Switches between English and Bangla; the button names the other language. */
export function LocaleToggle({ className, withIcon = false }: { className?: string; withIcon?: boolean }) {
  const { locale, t } = useStrings();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "bn" : "en")}
      aria-label={t("LANG_LABEL")}
      title={t("LANG_LABEL")}
      lang={locale === "en" ? "bn" : "en"}
      className={cn("inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink-2 hover:bg-muted hover:text-ink", className)}
    >
      {withIcon && <Languages className="size-5" aria-hidden />}
      {t("LANG_TOGGLE")}
    </button>
  );
}

/** Keeps <html lang> in step with the chosen language, for screen readers and the Bangla font. */
export function LocaleSync() {
  const { locale } = useStrings();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <BanglaDom />;
}
