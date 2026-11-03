// Builds deck/LaMP-AIgnite.pptx: the 5-slide deck for Ostad Presents YUNet AIgnite Buildathon 2026.
// Run from deck/: LIVE_URL=https://... node build-deck-aignite.js
// Palette from the earlier deck; Segoe UI so the PDF exported on Windows embeds the real font. Every number must match docs/PLAN.md section 6.
// The phone screenshots in assets/*-m.jpg come from the running app after a demo reset.
const path = require("path");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const LIVE_URL = process.env.LIVE_URL || "https://lamp-ai-web.onrender.com";
const ME = {
  name: "A K M Ishmam Tahmid",
  role: "Solo builder: product, design, code and pitch",
  where: "Bangladesh",
  github: "github.com/ishmam259",
};

const K = {
  ink: "231F20", white: "FFFFFF", grey: "5A5A5A", line: "D9D9D9",
  deep: "0F5132", mid: "198754", bright: "00BF63", strip: "00D300",
  mint: "E9F7EE", red: "BD0000", redTint: "FDF0F0",
};
const F = { reg: "Segoe UI", med: "Segoe UI Semibold", semi: "Segoe UI Semibold", xbold: "Segoe UI Black" };
const W = 13.333, H = 7.5, M = 0.55;
const A = (f) => path.join(__dirname, "assets", f);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "LaMP";
pres.subject = "Ostad Presents YUNet AIgnite Buildathon 2026";
pres.author = ME.name;
pres.theme = { headFontFace: F.reg, bodyFontFace: F.reg };
pres.defineSlideMaster({ title: "PLAIN", background: { color: K.white }, objects: [], slideNumber: { x: 12.55, y: 7.08, w: 0.5, h: 0.25, fontFace: F.reg, fontSize: 8, color: "9A9A9A", align: "right" } });

function T(s, text, o) {
  s.addText(text, { fontFace: F.reg, color: K.ink, margin: 0, valign: "top", isTextBox: true, ...o });
}
function rect(s, x, y, w, h, fill) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 } });
}
function strip(s) {
  rect(s, 0, H - 0.12, W, 0.12, K.strip);
}
function head(s, title, sub) {
  s.addShape(pres.shapes.ISOSCELES_TRIANGLE, { x: M, y: 0.52, w: 0.2, h: 0.18, rotate: 90, fill: { color: K.bright }, line: { color: K.bright, width: 0 } });
  T(s, title, { x: M + 0.32, y: 0.42, w: 12, h: 0.42, fontSize: 22, fontFace: F.semi, valign: "middle" });
  if (sub) T(s, sub, { x: M + 0.32, y: 0.9, w: 12, h: 0.4, fontSize: 13, color: K.grey });
}
function barRow(s, x, y, w, h, text, o = {}) {
  rect(s, x, y, w, h, o.fill ?? K.mint);
  rect(s, x, y, 0.06, h, o.bar ?? K.bright);
  T(s, text, { x: x + 0.2, y: y + 0.04, w: w - 0.3, h: h - 0.08, fontSize: o.size ?? 12, valign: "middle" });
}
async function fit(s, f, x, y, w, h) {
  const m = await sharp(A(f)).metadata();
  let iw = w, ih = (w * m.height) / m.width;
  if (ih > h) { ih = h; iw = (h * m.width) / m.height; }
  s.addImage({ path: A(f), x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih });
}

async function build() {
  // 1. Problem
  {
    const s = pres.addSlide({ masterName: "PLAIN" });
    s.addImage({ path: A("counter.jpg"), x: 7.9, y: 0, w: W - 7.9, h: H, sizing: { type: "cover", w: W - 7.9, h: H } });
    T(s, [{ text: "La", options: { color: K.ink } }, { text: "M", options: { color: K.bright } }, { text: "P", options: { color: K.ink } }],
      { x: M, y: 0.45, w: 7, h: 0.7, fontSize: 32, fontFace: F.xbold });
    T(s, "An AI money helper for the neighborhood pharmacy, and the families who buy there on credit", { x: M, y: 1.15, w: 7, h: 0.6, fontSize: 14, color: K.grey });
    T(s, "THE PROBLEM", { x: M, y: 2.05, w: 7, h: 0.35, fontSize: 13, fontFace: F.semi, color: K.mid });
    const rows = [
      "173,500+ licensed pharmacies in Bangladesh, most run by one family. Every number lives on paper.",
      "Each buys on credit from 10–50 companies and keeps only 10–15% of each sale. Green Life sold BDT 412,500 last month and kept BDT 13,500.",
      "Expiring stock and running out of cash before a big supplier bill mean empty shelves, so families go without medicine.",
      "Families buy on credit too. Green Life is owed BDT 38,000, and customers have no clear way to see or plan what they owe.",
    ];
    rows.forEach((t, i) => barRow(s, M, 2.5 + i * 1.05, 7, 0.9, t, { size: 12 }));
    strip(s);
  }

  // 2. Solution
  {
    const s = pres.addSlide({ masterName: "PLAIN" });
    head(s, "The solution", "Take a photo. Get a clear money picture. Ask in plain words. Approve every step yourself.");
    const cards = [
      ["Reads paper for you", "AI reads photos of supplier invoices and the sales book. The owner checks every field before it is saved."],
      ["Sees trouble early", "Cash for the next 30 days, bills due and stock expiring in 60 days, with a warning before the money runs out."],
      ["Cheapest money first", "Uses money already in the shop and free extra days from suppliers first, then compares loans. Demo: BDT 0, or BDT 181.97 instead of 421.64."],
      ["A card for every customer", "NEW. A family opens their card with a code, sees what they owe and picks a weekly plan. Amounts only, never names or medicines."],
    ];
    cards.forEach(([h, b], i) => {
      const x = M + i * 3.07, y = 1.75, w = 2.9, h2 = 3.2;
      rect(s, x, y, w, h2, K.mint);
      rect(s, x, y, w, 0.08, K.bright);
      T(s, h, { x: x + 0.2, y: y + 0.3, w: w - 0.4, h: 0.9, fontSize: 16, fontFace: F.semi, color: K.deep });
      T(s, b, { x: x + 0.2, y: y + 1.25, w: w - 0.4, h: 1.8, fontSize: 12.5 });
    });
    barRow(s, M, 5.3, 12.2, 0.9, "Safe by design: LaMP reads and suggests. The owner approves every step, loans need the PIN again, and LaMP never moves money.", { size: 13 });
    strip(s);
  }

  // 3. How it works
  {
    const s = pres.addSlide({ masterName: "PLAIN" });
    head(s, "How it works", "AI where it helps, plain math where money is involved.");
    const steps = [
      "1. Snap a photo: AI reads supplier invoices and sales-book pages.",
      "2. The owner checks and corrects. Nothing is saved without their yes.",
      "3. Plain code does all the money math: profit, cash ahead, expiring stock, loan costs. The AI never calculates money.",
      "4. Ask LaMP: the chat explains the shop's own figures and suggests the next step.",
      "5. The owner approves; customers set plans on their own card. Every step is saved in a history no one can secretly change.",
    ];
    steps.forEach((t, i) => barRow(s, M, 1.6 + i * 1.0, 6.4, 0.85, t, { size: 11.5 }));
    T(s, "Next.js · FastAPI · PostgreSQL · OpenAI Responses API", { x: M, y: 6.7, w: 6.4, h: 0.3, fontSize: 10, color: K.grey });
    const shots = [["today-m.jpg", "Owner: today"], ["funding-m.jpg", "Owner: the plan"], ["card-m.jpg", "Customer: their card"]];
    for (const [i, [f, cap]] of shots.entries()) {
      await fit(s, f, 7.3 + i * 2.0, 1.45, 1.85, 5.2);
      T(s, cap, { x: 7.3 + i * 2.0, y: 6.7, w: 1.85, h: 0.3, fontSize: 9.5, color: K.grey, align: "center" });
    }
    strip(s);
  }

  // 4. Participant
  {
    const s = pres.addSlide({ masterName: "PLAIN" });
    head(s, "About me");
    rect(s, M, 1.4, 12.2, 2.0, K.mint);
    rect(s, M, 1.4, 0.08, 2.0, K.bright);
    T(s, ME.name, { x: M + 0.4, y: 1.6, w: 11, h: 0.6, fontSize: 26, fontFace: F.semi, color: K.deep });
    T(s, ME.role, { x: M + 0.4, y: 2.25, w: 11, h: 0.4, fontSize: 14 });
    T(s, `${ME.where} · ${ME.github}`, { x: M + 0.4, y: 2.7, w: 11, h: 0.4, fontSize: 12, color: K.grey });
    T(s, "WHAT'S NEW FOR AIGNITE", { x: M, y: 3.8, w: 12, h: 0.35, fontSize: 13, fontFace: F.semi, color: K.mid });
    const rows = [
      "Started as a team prototype for FinTechathon 2026. Farhan Tahsin Khan co-built the original money math and server and agreed to this solo entry.",
      "New for AIgnite: customer cards with weekly payment plans, a Customers page for the owner, plain wording across the app, a public link and the official sticker.",
      "383 automated tests check every figure; the shared demo makes no paid AI calls and resets itself every hour.",
    ];
    rows.forEach((t, i) => barRow(s, M, 4.2 + i * 0.95, 12.2, 0.8, t, { size: 12 }));
    strip(s);
  }

  // 5. Try it
  {
    const s = pres.addSlide({ masterName: "PLAIN" });
    rect(s, 0, 0, W, H, K.deep);
    T(s, "Try it live", { x: M, y: 1.4, w: 12, h: 0.8, fontSize: 36, fontFace: F.xbold, color: K.white });
    T(s, LIVE_URL, { x: M, y: 2.3, w: 12, h: 0.6, fontSize: 24, fontFace: F.semi, color: K.strip, hyperlink: { url: LIVE_URL } });
    T(s, "Owner: PIN 2468 (Green Life Pharmacy, Bogura).   Customer: tap \"Check what you owe\", card GL-7KQM-4XPA.",
      { x: M, y: 3.1, w: 12, h: 0.5, fontSize: 14, color: K.white });
    T(s, "Free hosting: the first load can take up to a minute.", { x: M, y: 3.55, w: 12, h: 0.4, fontSize: 11, color: "CFE8DA" });
    const why = [
      "Real problem: one expired batch or one needless loan wipes out a week of a family's income.",
      "Meaningful AI: reads paper, explains numbers in plain words, suggests the cheapest way.",
      "Safe by design: the owner approves everything; the AI never touches money.",
    ];
    why.forEach((t, i) => T(s, "▶  " + t, { x: M, y: 4.2 + i * 0.6, w: 12, h: 0.5, fontSize: 14, color: K.white }));
    rect(s, 0, H - 0.12, W, 0.12, K.strip);
  }

  await pres.writeFile({ fileName: path.join(__dirname, "LaMP-AIgnite.pptx") });
  console.log("wrote LaMP-AIgnite.pptx");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
