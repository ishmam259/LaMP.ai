---
name: LaMP
description: Soft white cards on a pale green shelf. One big number per screen says what the money does next.
colors:
  shelf: "#f5f8f6"
  board: "#ffffff"
  ink: "#14201b"
  ink-2: "#55625c"
  rule: "#e2e8e5"
  cash: "#0f6b4f"
  cash-tint: "#e5f2ec"
  stock: "#1e7a4f"
  stock-tint: "#e6f3ec"
  warn: "#9a5800"
  warn-tint: "#fdf1de"
  alert: "#c4301e"
  alert-tint: "#fbeae7"
  muted: "#eef3f0"
  input: "#cfd8d3"
  dark-shelf: "#0a110e"
  dark-board: "#111b17"
  dark-ink: "#e8efeb"
  dark-ink-2: "#a3b2ab"
  dark-cash: "#86d4b0"
  dark-brand: "#17805e"
  dark-alert: "#ff8f80"
  dark-warn: "#f2b45c"
  dark-stock: "#7fd3a6"
typography:
  display:
    fontFamily: "Barlow Semi Condensed"
    fontWeight: 700
    fontSize: "2.75rem"
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  page-title:
    fontFamily: "Barlow Semi Condensed"
    fontWeight: 700
    fontSize: "2.5rem"
    lineHeight: 1
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Barlow"
    fontWeight: 600
    fontSize: "0.8125rem"
    lineHeight: 1.3
    letterSpacing: "0.07em"
  body:
    fontFamily: "Barlow"
    fontWeight: 400
    fontSize: "1rem"
    lineHeight: 1.5
  label:
    fontFamily: "Barlow"
    fontWeight: 600
    fontSize: "0.75rem"
    lineHeight: 1.35
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  card: "20px"
  hero: "24px"
  pill: "999px"
spacing:
  gutter: "16px"
  card-pad: "20px"
  grid-gap: "20px"
  target: "44px"
  rail: "232px"
  rail-collapsed: "76px"
  side-panel: "340px"
components:
  button-primary:
    backgroundColor: "{colors.cash}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-outline:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  card:
    backgroundColor: "{colors.board}"
    rounded: "{rounded.card}"
    padding: "20px"
  hero-card:
    backgroundColor: "{colors.board}"
    rounded: "{rounded.hero}"
    padding: "24px 28px"
  stamp:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  rail-link-active:
    backgroundColor: "{colors.cash-tint}"
    textColor: "{colors.cash}"
    rounded: "{rounded.lg}"
    height: "44px"
---

# LaMP design system

## Overview

**North star: the counter ledger.** A pharmacy owner looks at LaMP between customers, on a cheap Android phone in bright light. Every screen answers one question first: what happens to my cash next, and when? That answer is one big number on one hero card. Everything else is a calm stack of white cards that the owner can scan and ignore.

The world is a clean shop counter, not a bank. It uses a pale green-white shelf, white cards with soft shadows that lift a little, rounded pill buttons in LaMP green, and a condensed display face for the numbers that matter. Colour carries meaning, not decoration. Red is a problem, amber needs you, and green is good or the way forward.

This is an Operate product: scanning, consistency and big touch targets come before expression. The brand lives in a few details: the italic green accent inside the hero number, the soft green glow behind the hero card, and the official AIgnite sticker in every header.

**Key characteristics**
- One hero card per screen with one big number. Never two heroes side by side.
- White cards on a pale shelf, separated by soft shadow rather than heavy borders.
- Pill-shaped buttons; the primary one is LaMP green with a green glow under it.
- Card titles are small, tracked, uppercase labels. Page titles use the condensed display face.
- Tabular numbers everywhere money appears, so amounts line up like a price list.
- Plain English (or plain Bangla when chosen). No finance, AI or developer words (see CLAUDE.md).

## Colors

The palette is about 60% neutral (shelf and white cards), 30% LaMP green (actions, active menu items, accents) and 10% state colour (red and amber, only when something is wrong or waiting).

| Token | Light | Dark | Role |
|---|---|---|---|
| `--shelf` | `#f5f8f6` | `#0a110e` | Page background, with a faint green glow at the top |
| `--board` | `#ffffff` | `#111b17` | Cards, side menu, phone tab bar |
| `--ink` | `#14201b` | `#e8efeb` | Main text and numbers |
| `--ink-2` | `#55625c` | `#a3b2ab` | Secondary text, card titles, asides |
| `--rule` | `#e2e8e5` | white at 9% | Hairlines, card edges, dividers |
| `--cash` / `--brand` | `#0f6b4f` | `#86d4b0` / `#17805e` | LaMP green: primary buttons, links, active menu item, italic accent |
| `--cash-tint` | `#e5f2ec` | `#12302a` | Active menu background, icon circles |
| `--stock` | `#1e7a4f` | `#7fd3a6` | Good news: money coming in, "You kept", cash holds |
| `--warn` | `#9a5800` | `#f2b45c` | Needs you: approvals waiting, loan pending |
| `--alert` | `#c4301e` | `#ff8f80` | Problem: cash short, a suspicious document |
| `*-tint` | pale washes | deep washes | Behind a stamp or a highlighted row of the same state |

**Rules**
- Colour is state only. A card's title turns red, amber or green only when its content means that, and an icon comes with it, so colour is never the only signal.
- Green is the single action colour. There is no second accent.
- Highlighted rows (a short day in "Coming up") use the matching tint background, never a coloured side bar.
- Every text and background pair meets WCAG AA (4.5:1) in both themes. The dark theme lightens the state colours instead of reusing the light hexes.

## Typography

- **Barlow** (400–800) for all interface text: body, labels, buttons, menu.
- **Barlow Semi Condensed** (600–800, with italic) for page titles, the hero number and the big figures inside cards. Condensed letters keep long amounts like "BDT 1,19,000" on one line on a phone.

| Role | Face | Size | Weight | Notes |
|---|---|---|---|---|
| Hero number (`.sb-head`) | Semi Condensed | 2.375rem phone / 2.75rem from 640px | 700 | Line height 1.05; the amount part is italic in the state colour |
| Page title (`.display`) | Semi Condensed | 2rem phone / 2.5rem desktop | 600–700 | One per page, never with a label above it |
| Card figure | Semi Condensed | 1.5–2.25rem | 700 | Always `.num` |
| Card title | Barlow | 0.8125rem | 600 | Uppercase, 0.07em tracking, `--ink-2` or state colour |
| Body | Barlow | 1rem (1.0625rem under the hero) | 400–500 | Line height 1.5 |
| Stamp / label | Barlow | 0.75rem | 600 | Uppercase, 0.06em tracking |

- `.num` turns on `tabular-nums lining-nums` for every amount, count and date.
- Headings use `text-wrap: balance`. Nothing on screen goes below 12px; body text never goes below 16px.

## Layout

- **Phone first.** 16px side gutters and a single column. The floating tab bar holds Today, Cash, Scan, Stock and Plan. Today ends with a "More" list (Customers, Credit record, Wallet, Rules, History, Quick tour) in one card.
- **Phone header:** sticky, frosted (white at 80% with blur), showing the wordmark, the sticker and the shop name.
- **Phone tab bar:** floats 12px above the safe area, `rounded-2xl`, frosted white, `shadow-lift`, at most 420px wide, five equal cells, each at least 44px tall.
- **Desktop (from 1024px):** a grid of side menu + main column, plus a 340px right panel (the chat and live log) from 1280px.
  - **Side menu:** white, 232px wide, and collapsible to 76px of icons. The choice is remembered in this browser. Its 64px header (wordmark + shrink button) lines up with the 64px top bar, so their bottom rules meet in one line. It never scrolls. On screens under 760px tall (`short:` variant) the shop block hides and the links tighten from 44px to 36px.
  - **Top bar:** 64px, sticky, frosted shelf colour. Holds the sticker, Pause and notifications.
- **Today on desktop:** a 12-column grid. The hero card and "Coming up" take 7 columns; "Waiting for you", "Expiring stock" and "Last 30 days" take the other 5. "Waiting for you" sits right under the hero on phones and at the top of the right column on desktop.
- **Spacing:** 16px between stacked cards on phones, 20px grid gaps on desktop, 20px inside cards, and 24–28px inside the hero.

## Elevation & Depth

Depth is soft and wide, never hard. There are three shadow tokens:

| Token | Value (light) | Used on |
|---|---|---|
| `--card-shadow` | inset 1px white highlight + `0 20px 60px -30px` ink at 25% | Cards, hero card |
| `--lift-shadow` | same, deeper: `0 28px 70px -30px` at 32% | Card hover (lifts 2px), phone tab bar |
| `--button-glow` | `0 18px 40px -18px` LaMP green at 55% | Primary button only |

- In the dark theme the shadows go to near-black and the inset highlight drops to 4–5% white, so cards separate by the `--board` / `--shelf` step instead.
- The hero card has a soft radial green glow (`--glow`) behind its top-right corner. It is the only decorative light in the app.
- Frosted surfaces (phone header, tab bar, desktop top bar) use `backdrop-blur-md` over a semi-transparent fill.
- The hover lift only applies on devices that can hover, and it respects `prefers-reduced-motion`.

## Shapes

- Hero card: 24px radius. Cards: 20px. Inputs, menu links and small buttons: 12px (`--radius`). The phone tab bar: 16px.
- Buttons, stamps, the hero's date pill and the "Waiting" badge are full pills (999px).
- Icon circles (the shop icon, "More" list icons) are full circles in `--cash-tint` with a green icon.
- Edges are 1px `--rule` hairlines. No border is ever thicker than 1px, and no card has a coloured side stripe.

## Components

**Hero card (`.station-board`).** White, 24px radius, a green glow at the top right. It holds one message: either "Short BDT 19,000" with the amount in italic red, or "Cash holds for 30 days" in green. A date pill in the state tint (`.sb-time`) sits beside it, with a line below saying why. Its actions sit inside the card: a large primary "See the plan" button and a text link "Cash, day by day". It's used once per screen and has no label above the number.

**Card (`Carton`, `.carton`).** White, 20px radius, soft shadow, with a 2px lift on hover. The head row holds a small uppercase title on the left (with a state icon when the tone is alert, warn or stock) and a quiet aside on the right (a date range, "Next 60 days"). The body has 20px padding. Lists inside it use `divide-rule` hairlines.

**Buttons.**
- **Primary:** a LaMP green pill, 44px tall (48px for `lg`), white text and a green glow. One per area.
- **Outline:** a white pill with a hairline border and a tiny shadow, for secondary actions such as "Review and approve".
- **Text links:** green, 44px tall hit area, with an arrow icon.
- All buttons press down 1px when tapped and show a 3px green focus ring.

**Stamp (`.stamp`).** A small uppercase pill for dates, batches and counts. It's neutral by default; `stamp-alert`, `stamp-warn`, `stamp-stock` and `stamp-cash` use the matching tint and ink.

**Side menu link (`RailLink`).** 44px tall, 12px radius, icon plus label. Active: `--cash-tint` background with green text, and no side bar. Collapsed: an icon only, a tooltip with the label, the label kept for screen readers, and the "waiting" count as a red badge on the corner.

**Coming up row.** A three-column grid: date with weekday, what happens, and the signed amount. Money in is green. A short day gets an `--alert-tint` rounded background and a red "Short …" line.

**Phone tab bar.** A floating frosted bar with five cells, icon over label. The active cell is green on `--cash-tint`.

**Sticker.** The official AIgnite sticker sits near the top of every page: the owner header, the customer header and the PIN screen. Never remove or hide it.

## Do's and Don'ts

**Do**
- Lead every screen with the one number that matters, in the display face.
- Use `.num` on every amount, and write money as `BDT 19,000` or the shared `bdt()` and `num()` helpers.
- Keep touch targets at least 44 × 44px, with at least 8px between them.
- Use state colour only with an icon or words that say the same thing.
- Test both themes. Dark mode has its own state hexes; don't reuse the light ones.
- Keep the desktop side menu free of scrolling. Tighten it with the `short:` variant instead.

**Don't**
- Don't put a small label or "kicker" above a heading or the hero number.
- Don't add coloured left or right borders thicker than 1px, or coloured side stripes on cards or menu items.
- Don't introduce a second accent colour, gradients on text, or decorative illustrations.
- Don't show two hero cards on one screen, or put the hero's actions outside its card.
- Don't use jargon in labels ("shortfall", "funding", "audit", "model", setting names). Say "Short", "the plan", "History".
- Don't show medicine names or real names on customer cards (`/me/<code>`). Show amounts only.
- Don't swap Barlow for another font, or copy another product's type.
