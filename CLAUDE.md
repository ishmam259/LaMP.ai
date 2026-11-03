# LaMP: rules for AI coding sessions

LaMP is a solo entry by @ishmam259 for **Ostad Presents YUNet AIgnite Buildathon 2026**: a B2C web app that solves an everyday problem with meaningful AI. It helps the person running a neighborhood pharmacy in Bangladesh, and the families who buy medicine there on credit. Follow these rules exactly.

## Read first
- `README.md`: what the app does, how to run it
- `docs/IDEA_AND_PROBLEM.md`: the problem and the demo story
- `docs/PLAN.md`: architecture, API contract and the golden numbers (section 6)
- `docs/AIGNITE_SUBMISSION.md`: what still has to be submitted

## Buildathon requirements
- A public live web app judges can test (Render, `render.yaml`).
- The official sticker visible near the top of every page: `frontend/public/aignite-sticker.png`, shown by `frontend/src/components/sticker.tsx`. Don't remove it from the PIN screen, the owner header or the customer header.
- A deck of at most 5 slides: `deck/build-deck-aignite.js`. Any demo video must be in English.
- Deadline: 5 Nov 2026, 23:59 Bangladesh time, submitted on Devpost only.

## Git
- Commit small and often, with short plain messages prefixed by area: `engines: ...`, `api: ...`, `frontend: ...`, `deck: ...`, `docs: ...`.
- **Never add `Co-Authored-By` lines or any AI or Claude attribution** to commits or PR descriptions. Commits are made under the human's own git identity.
- Never commit `.env` or any API key.
- `eval/replay/` holds recorded OpenAI answers; never edit those files by hand.

## Technical rules
- The app uses **OpenAI** (`gpt-6-luna` by default) through the **Responses API**, called only from `backend/app/agents/`. Don't add Anthropic or other LLM SDKs to the app.
- All money math lives in `backend/app/engines/` as deterministic Python. The LLM never computes money.
- The chat's tools are read-only plus `propose_action`. Never give it a tool that approves, executes, transfers money or contacts anyone.
- Engines use `settings.as_of_date` from the pharmacy, never the real clock.
- Tests never call the OpenAI API (`LLM_MODE=replay`). The shared demo runs live (`LLM_MODE=live`, key set in Render only): recorded inputs are served free, and new calls stop at `LLM_DAILY_BUDGET_USD`.
- Keep OpenAI spend tiny: no loops that call the API; resize images to ≤ 1,600 px.
- The golden numbers in `docs/PLAN.md` section 6 must be reproduced exactly.
- Customer cards (`/me/<code>`) show amounts only. Never store or show medicine names linked to a customer, or a customer's real name.
- Plain English everywhere in the UI, chat answers, captions and deck: no AI, finance or developer jargon (no "model", "replay", "passport", "audit", "funding", "capture", "gross profit", "overheads", "shortfall", setting names). The owner's pages are Today, Cash, Scan, Stock, Plan, Customers, Approvals, Credit record, Wallet, Rules and History.
- English only in the app, docs and UI. No blockchain.
- Check current library docs (OpenAI SDK, PydanticAI, Next.js, AI SDK) before using an API name you aren't sure of.
