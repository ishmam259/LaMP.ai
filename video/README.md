# Demo video

`LaMP-AIgnite-demo.mp4` (about 2 minutes, 1920x1080 at 60 fps, English captions, no sound) is cut from three takes recorded against the local app. The film and the raw takes stay out of git; upload the film to YouTube (unlisted is fine) and put the link on Devpost.

**Story:** title card → PIN → Today (short BDT 19,000) → Scan (AI reads an invoice) → Plan (BDT 0 or 181.97 instead of 421.64) → Ask LaMP → owner approves in Approvals → the customer's card on a phone (4 weekly parts) → the owner's Customers page and History → end card.

## Re-record
1. Start the database (`docker compose up -d db`), the API with `DEV_MODE=true` and `LLM_MODE=replay`, and a production build of the frontend on port 3000 (`npm --prefix frontend run build`, then `npm --prefix frontend run start`): no dev overlay, and smoother.
2. Install Playwright once: `pip install playwright httpx`.
3. Record (resets the demo first; uses Microsoft Edge, since Windows Smart App Control can block Playwright's own Chromium). The browser can't stream a full 1080p frame every 1/60 s, so the recorder plays each take at a third of real speed, CSS animations included, and retimes the frames three times faster: every frame of the 60 fps film is a real one. It takes about 7 minutes:
   ```bash
   python video/record_aignite.py video/takes
   ```
4. Cut the film (needs ffmpeg and Pillow; the last argument is the link shown on the end card):
   ```bash
   python video/make_aignite.py video/takes video/LaMP-AIgnite-demo.mp4 lamp-ai-web.onrender.com
   ```

Captions live in `CAPTIONS` in `make_aignite.py`, timed from the scene marks the recorder writes, so a new take keeps them in step. Sections meet with a half-second crossfade. To change only the end-card link, run step 4 again; no re-recording needed.
