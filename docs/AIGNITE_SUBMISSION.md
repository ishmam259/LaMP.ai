# AIgnite Buildathon 2026: submission checklist

**Deadline:** 5 Nov 2026, 23:59 Bangladesh time. Submit on Devpost only: https://yunet-aignite26.devpost.com/. Submit as an individual even if Devpost suggests a team.

## Deliverables
| Item | Status | Where |
|---|---|---|
| Live web app (mandatory) | Live: https://lamp-ai-web.onrender.com | Render Blueprint from `render.yaml` (steps below) |
| Deck, max 5 slides (mandatory) | Ready | `deck/LaMP-AIgnite.pdf` (rebuild if the live link changes) |
| Demo video in English (optional) | Recorded: 1:56, 1080p at 60 fps, English voiceover and captions | `video/LaMP-AIgnite-demo.mp4` (not in git): upload to YouTube, unlisted is fine. How to re-cut: `video/README.md` |
| GitHub repo (optional) | Ready, private | https://github.com/ishmam259/LaMP.ai (organizers may ask for access) |

Done: official sticker on every page (PIN screen, owner header, customer header), customer cards, plain wording, Farhan's agreement to the solo entry.

## Deploy on Render
1. Render → New → Blueprint → connect the `ishmam259/LaMP.ai` repo → apply. It creates `lamp-ai-db`, `lamp-ai-api` and `lamp-ai-web`, all on free plans. When it asks for `OPENAI_API_KEY`, paste your OpenAI key (it stays in Render; never put it in the repo). Leave the Brevo and alert-email values empty.
2. When `lamp-ai-api` is live, copy its URL (for example `https://lamp-ai-api.onrender.com`).
3. On `lamp-ai-web` → Environment, set `BACKEND_URL` to that URL, then Manual Deploy → Clear build cache & deploy (the URL is baked in at build time).
4. Open the `lamp-ai-web` URL in a private window: PIN 2468 works, and "Check what you owe" opens card `GL-7KQM-4XPA`.
5. If the web URL isn't `https://lamp-ai-web.onrender.com`, rebuild the deck: `cd deck && LIVE_URL=<url> node build-deck-aignite.js`, then export the PDF again.

Free plans: each service sleeps after 15 minutes without visitors, and the first visit after that takes about a minute. Open the link yourself a minute before you expect judges. The free database expires 30 days after it is created (Render then gives 14 days to upgrade before deleting it), so a database made now lasts through judging. Render allows one free database per account.

OpenAI: new photos and new chat questions use your key with no daily limit (`LLM_DAILY_BUDGET_USD=0`). Demo photos and the suggested questions stay free.

## Demo video story (as recorded)
1. Title card with the sticker, then the owner unlocks with the PIN.
2. Today: short BDT 19,000 on 26 Oct.
3. Scan: AI reads a supplier invoice photo; the owner checks it.
4. Plan: order fewer slow sellers, ask for more days, borrow only what's left. BDT 0, or BDT 181.97 instead of 421.64.
5. Ask LaMP: "Can I pay Supplier A's order next week?" LaMP answers in plain words and puts the plan's steps in Approvals.
6. The owner approves two steps; the savings show BDT 11,039.67.
7. On the customer's phone: card GL-7KQM-4XPA → 4 weekly parts of BDT 1,625.
8. The owner's Customers page shows the plan; History records every step. End card with the live link.

## Devpost "what's new" text (draft)
LaMP started as a team prototype for FinTechathon 2026 (with Farhan Tahsin Khan, who agreed to this solo entry). For AIgnite I added a consumer side: each family that buys on credit gets a card where they can see what they owe and choose a weekly payment plan, and the owner sees every plan on a new Customers page. I also rewrote the app in plain language, deployed it publicly for judges, added the official sticker, and rebuilt the pitch as a 5-slide story.

## Devpost "how to try it" text (draft)
The app shows no test logins, so judges need these from Devpost, the deck or the video's end card:
- Owner: open the live link and enter PIN **2468** (Green Life Pharmacy, Bogura).
- Customer: on the PIN screen tap "Bought medicine on credit? Check what you owe" and enter card **GL-7KQM-4XPA**.
- Ask LaMP anything about the shop, or scan your own supplier invoice.
- If the site has been idle, the first visit takes about a minute.
- The shared data resets itself every hour.
