# Demo video

`LaMP-AIgnite-demo.mp4` (1:56, 1920x1080 at 60 fps, English voiceover and captions) is cut from three takes recorded against the local app. The film and the raw takes stay out of git; upload the film to YouTube (unlisted is fine) and put the link on Devpost.

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

Captions live in `CAPTIONS` in `make_aignite.py`, timed from the scene marks the recorder writes, so a new take keeps them in step. Sections meet with a half-second crossfade. To change only the end-card link, run step 4 again; no re-recording needed. This makes the silent cut.

## Voiceover
The published film carries a voiceover read from `VOICEOVER.md` in one take.
1. Clean the recording: cut low rumble, remove background hiss and level it to -16 LUFS.
   ```bash
   ffmpeg -i voice.m4a -af "highpass=f=80,lowpass=f=12000,afftdn=nr=20:nf=-50:tn=1,agate=threshold=0.012:ratio=3:attack=5:release=180:range=0.06,loudnorm=I=-16:TP=-1.5:LRA=11" -ac 1 video/takes/voice_clean.wav
   ```
2. Cut the film to the voice. Each scene changes in the pause before its line, plays faster if it's longer than the line, and holds its last frame if it's shorter. The captions are the spoken words.
   ```bash
   python video/make_voiced.py video/takes video/takes/voice_clean.wav video/LaMP-AIgnite-demo.mp4 lamp-ai-web.onrender.com
   ```
   `LINES` in `make_voiced.py` holds where each line is spoken in the recording. Re-measure them for a new recording with `ffmpeg -i video/takes/voice_clean.wav -af silencedetect=noise=-32dB:d=0.35 -f null -`.
