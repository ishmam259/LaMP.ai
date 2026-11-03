# Deck

- **`LaMP-AIgnite.pptx`** and **`LaMP-AIgnite.pdf`:** the 5-slide deck for AIgnite Buildathon 2026 (problem, solution, how it works, about me, try it live).

The deck is generated, so edit `build-deck-aignite.js` and rebuild rather than editing the .pptx by hand:

```bash
cd deck
npm install
LIVE_URL=https://your-live-link node build-deck-aignite.js
```

Then export the PDF (fonts embedded):

```bash
"C:/Program Files/LibreOffice/program/soffice.exe" --headless --convert-to pdf LaMP-AIgnite.pptx
```

- **Font:** Segoe UI, so the PDF exported on Windows embeds the real font. The .pptx swaps in another font on a computer without it.
- **Numbers:** must match the golden numbers in `docs/PLAN.md` section 6.
- **Screenshots** (`assets/*-m.jpg`) are phone-width captures of the running app after `POST /api/v1/dev/reset?with_demo_captures=true`. Retake them if the UI changes.
- **Photo:** `assets/counter.jpg`, a Bangladeshi pharmacy counter.
