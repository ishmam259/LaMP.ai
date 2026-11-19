# Deck

- **`LaMP-AIgnite.pptx`** and **`LaMP-AIgnite.pdf`:** the 5-slide deck for AIgnite Buildathon 2026 on the official template (cover with project and developer name, problem, solution, how it works, try it live).
- **Template:** 10" × 5.625". `assets/aignite-cover.jpg` and `assets/aignite-page.jpg` are the two backgrounds from the organizers' `YUnet_AIgnite_Project_presentation_Template.pptx`. Keep content below the logo and above the skyline.

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
- **Pitch, not demo:** slides 2–4 describe the problem across Bangladesh, how LaMP solves it and how the app works in general. Keep single-shop and demo figures off them; the demo logins live only on slide 5.
- **Screenshots** (`assets/*-m.jpg`) are phone-width captures of the running app, kept for the video and Devpost. The deck no longer uses them.
- **Photo:** `assets/counter.jpg`, a Bangladeshi pharmacy counter.
