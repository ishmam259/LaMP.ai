# AIgnite Buildathon 2026: submission checklist

**Deadline:** 5 Nov 2026, 23:59 Bangladesh time. Submit on Devpost only: https://yunet-aignite26.devpost.com/. Don't leave it to the last hour.

## Rules that affect us
- **Solo.** Submit as an individual even if Devpost suggests a team. Farhan co-built the FinTechathon version: confirm with him that you may submit it alone, and keep the credit line in the README and deck.
- **Existing project allowed** only with meaningful improvements for this buildathon. Say what's new on the Devpost page.
- **B2C.** Pitch the everyday pharmacy owner and the families who depend on the shop.
- **Sticker** visible in the navbar or near the top of the page.

## Checklist
- [ ] Download the official sticker from the organizers' Google Drive folder and save it as `frontend/public/aignite-sticker.png` (PNG with a transparent background works best on the dark header).
- [ ] Check it shows on the PIN screen, the phone header and the desktop top bar.
- [ ] Deploy with `render.yaml` (Render Blueprint): set `BACKEND_URL` on `lamp-web` and `CORS_ORIGINS` on `lamp-api`. Free Render services sleep after 15 minutes, so open the link a minute before judging and say "first load can take up to a minute" on Devpost.
- [ ] Put the live URL into `LIVE_URL` in `deck/build-deck-aignite.js`, then `cd deck && node build-deck-aignite.js`. Export `LaMP-AIgnite.pptx` to PDF.
- [ ] Devpost page: live link (mandatory), 5-slide deck (mandatory), English demo video (optional; the existing one is at https://youtu.be/YPS1GpFBRPQ, check it says nothing team-only), GitHub link (optional).
- [ ] Test the live link in a private window on a phone and a laptop.

## Devpost "what's new" text (draft)
LaMP started as a team prototype for FinTechathon 2026. For AIgnite I deployed it as a public app judges can try, reframed it around the everyday person running a neighborhood pharmacy and the families who rely on it, added the official sticker, and rewrote the pitch as a 5-slide story.
