"use client";

import { useEffect } from "react";
import { toBangla } from "@/lib/bangla-text";
import { useStrings } from "@/lib/strings";

/**
 * While Bangla is chosen, puts the Bangla for server text (plans, approvals, history, dates)
 * on screen. It only changes the words inside text and three attributes; React keeps owning the
 * page, and the next render's English is turned into Bangla again. Switching back to English
 * puts the original words back. Mark an element translate="no" to leave it alone (chat answers).
 */
const ATTRS = ["aria-label", "title", "placeholder"] as const;

export function BanglaDom() {
  const { locale } = useStrings();

  useEffect(() => {
    if (locale !== "bn") return;
    const texts = new Map<Text, { en: string; bn: string }>();
    const attrs = new Map<Element, Record<string, { en: string; bn: string }>>();
    const skip = (el: Element | null) => !el || !!el.closest("script,style,textarea,[translate=no],[contenteditable]");

    const text = (n: Text) => {
      if (skip(n.parentElement)) return;
      const now = n.nodeValue ?? "";
      const known = texts.get(n);
      if (known && known.bn === now) return;
      const bn = toBangla(now);
      if (bn !== now) {
        texts.set(n, { en: now, bn });
        n.nodeValue = bn;
      }
    };
    const attr = (el: Element) => {
      if (skip(el)) return;
      for (const a of ATTRS) {
        const now = el.getAttribute(a);
        if (!now) continue;
        const rec = attrs.get(el) ?? {};
        if (rec[a]?.bn === now) continue;
        const bn = toBangla(now);
        if (bn !== now) {
          rec[a] = { en: now, bn };
          attrs.set(el, rec);
          el.setAttribute(a, bn);
        }
      }
    };
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return text(root as Text);
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      attr(root as Element);
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (n.nodeType === Node.TEXT_NODE) text(n as Text);
        else attr(n as Element);
      }
    };

    walk(document.body);
    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "characterData") text(r.target as Text);
        else if (r.type === "attributes") attr(r.target as Element);
        else r.addedNodes.forEach(walk);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });

    return () => {
      obs.disconnect();
      texts.forEach((v, n) => {
        if (n.nodeValue === v.bn) n.nodeValue = v.en;
      });
      attrs.forEach((rec, el) => {
        for (const [a, v] of Object.entries(rec)) if (el.getAttribute(a) === v.bn) el.setAttribute(a, v.en);
      });
    };
  }, [locale]);

  return null;
}
