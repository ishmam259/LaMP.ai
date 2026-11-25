// Builds deck/LaMP-AIgnite.pptx: the 5-slide deck for Ostad Presents YUNet AIgnite Buildathon 2026.
// Run from deck/: LIVE_URL=https://... node build-deck-aignite.js
// Follows the official AIgnite template (10" x 5.625"): its cover with the Project Name and
// Developer Name boxes, and its branded page for every other slide. The two backgrounds,
// assets/aignite-cover.jpg and assets/aignite-page.jpg, are copied from that template.
// Keep content inside the page's clear area: below the logo (y > 0.9") and above the skyline (y < 4.95").
// Segoe UI so the PDF exported on Windows embeds the real font. Every number must match docs/PLAN.md section 6.
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");
const QRCode = require("qrcode");

const LIVE_URL = process.env.LIVE_URL || "https://lamp-ai-web-8sls.onrender.com";
const DEMO_URL = "https://www.youtube.com/@ishmamtahmid7936";
const ME = { name: "A K M Ishmam Tahmid" };

// Colors taken from the template's artwork.
const K = {
  navy: "1D1650", purple: "5A2A82", orange: "E8602C", tint: "FDEEE6",
  ink: "231F20", grey: "5A5A5A", white: "FFFFFF",
};
const F = { reg: "Segoe UI", semi: "Segoe UI Semibold", bold: "Segoe UI Black" };
const X0 = 0.45, XW = 9.1; // content left edge and width
const TOP = 0.98;          // first content row, below the title
const A = (f) => path.join(__dirname, "assets", f);

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625, same as the template
pres.title = "LaMP";
pres.subject = "Ostad Presents YUNet AIgnite Buildathon 2026";
pres.author = ME.name;
pres.theme = { headFontFace: F.semi, bodyFontFace: F.reg };

pres.defineSlideMaster({ title: "COVER", background: { path: A("aignite-cover.jpg") }, objects: [] });
pres.defineSlideMaster({
  title: "PAGE",
  background: { path: A("aignite-page.jpg") },
  objects: [{
    placeholder: {
      options: { name: "title", type: "title", x: 1.65, y: 0.3, w: 7.2, h: 0.5, fontFace: F.semi, fontSize: 22, bold: false, color: K.navy, valign: "middle", margin: 0 },
      text: "",
    },
  }],
});

function T(s, text, o) {
  s.addText(text, { fontFace: F.reg, color: K.ink, margin: 0, valign: "top", isTextBox: true, ...o });
}
function card(s, x, y, w, h, fill = K.tint) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, width: 0 } });
}
function dot(s, x, y, n, d = 0.36) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: K.orange }, line: { color: K.orange, width: 0 } });
  T(s, String(n), { x, y, w: d, h: d, fontSize: 12, fontFace: F.semi, color: K.white, align: "center", valign: "middle" });
}
async function icon(name, color) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Fa[name], { color: "#" + color, size: 256 }));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
// An icon in a rounded orange square, like the symptom tiles in a pitch deck.
async function tile(s, x, y, name, d = 0.62) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: d, h: d, rectRadius: 0.1, fill: { color: K.orange }, line: { color: K.orange, width: 0 } });
  s.addImage({ data: await icon(name, K.white), x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56 });
}
function line(s, x, y, w, h, color = K.navy, width = 1.25) {
  s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color, width } });
}
function page(title) {
  const s = pres.addSlide({ masterName: "PAGE" });
  s.addText(title, { placeholder: "title" });
  return s;
}
async function build() {
  // 1. Cover: the template's own Project Name and Developer Name boxes.
  {
    const s = pres.addSlide({ masterName: "COVER" });
    T(s, "LaMP", { x: 2.95, y: 3.86, w: 5.3, h: 0.35, fontFace: F.bold, fontSize: 15, color: K.navy, valign: "middle" });
    T(s, ME.name, { x: 3.76, y: 4.281, w: 3.45, h: 0.235, fontSize: 11, fontFace: F.semi, color: K.navy, valign: "middle" });
  }

  // 2. Problem, pitch-deck style: photo with the core issue on the left, symptoms on the right.
  // National picture only: no single shop or demo figures.
  {
    const s = page("The problem");
    const px = X0, py = TOP, pw = 4.3, ph = 3.87;
    s.addImage({ path: A("counter.jpg"), x: px, y: py, w: pw, h: ph, sizing: { type: "cover", w: pw, h: ph } });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: pw, h: ph, fill: { color: K.navy, transparency: 30 }, line: { color: K.navy, width: 0 } });
    T(s, "173,500+", { x: px + 0.25, y: py + 0.18, w: pw - 0.5, h: 0.55, fontSize: 28, fontFace: F.bold, color: K.white });
    T(s, "licensed pharmacies in Bangladesh", { x: px + 0.25, y: py + 0.72, w: pw - 0.5, h: 0.3, fontSize: 12, color: K.white });
    s.addShape(pres.shapes.RECTANGLE, { x: px + 0.2, y: 2.55, w: pw - 0.4, h: 2.0, fill: { type: "none" }, line: { color: K.orange, width: 1.5, dashType: "dash" } });
    s.addShape(pres.shapes.RECTANGLE, { x: px + 0.4, y: 2.38, w: 1.55, h: 0.34, fill: { color: K.orange }, line: { color: K.orange, width: 0 } });
    T(s, "CORE ISSUE", { x: px + 0.4, y: 2.38, w: 1.55, h: 0.34, fontSize: 11, fontFace: F.bold, color: K.white, align: "center", valign: "middle" });
    T(s, "PHARMACIES RUN ON PAPER AND THIN MARGINS, SO ONE CASH GAP EMPTIES THE SHELVES",
      { x: px + 0.4, y: 2.85, w: pw - 0.8, h: 1.55, fontSize: 14, fontFace: F.bold, color: K.white, align: "center", valign: "middle" });

    T(s, "SYMPTOMS", { x: 5.55, y: TOP, w: 3.5, h: 0.3, fontSize: 12, fontFace: F.bold, color: K.navy });
    const symptoms = [
      ["FaFileInvoice", "10–50 SUPPLIERS, EVERY BILL ON PAPER"],
      ["FaPercentage", "10–15% MARGINS: ONE EXPIRED BATCH WIPES OUT A WEEK"],
      ["FaUniversity", "BANKS CAN'T LEND ON PAPER RECORDS"],
      ["FaUsers", "FAMILIES BUY ON CREDIT WITH NO CLEAR BILL"],
    ];
    const d = 0.62, ys = symptoms.map((_, i) => 1.42 + i * 0.86);
    line(s, 5.2, ys[0] + d / 2, 0, ys[3] - ys[0]);
    line(s, px + pw, 3.55, 5.2 - (px + pw), 0);
    for (const [i, [ic, t]] of symptoms.entries()) {
      line(s, 5.2, ys[i] + d / 2, 0.35, 0);
      await tile(s, 5.55, ys[i], ic, d);
      T(s, t, { x: 6.35, y: ys[i], w: 3.2, h: d, fontSize: 10.5, fontFace: F.semi, color: K.ink, valign: "middle" });
    }
  }

  // 3. Solution: the reveal on the left, how each symptom is answered on the right.
  {
    const s = page("The solution");
    const px = X0, py = TOP, pw = 4.0, ph = 3.87;
    card(s, px, py, pw, ph, K.navy);
    T(s, "WHAT'S THE SOLUTION?", { x: px + 0.3, y: py + 0.25, w: pw - 0.6, h: 0.3, fontSize: 11, fontFace: F.bold, color: K.tint });
    T(s, [
      { text: "La", options: { color: K.white } }, { text: "M", options: { color: K.orange } }, { text: "P", options: { color: K.white } },
    ], { x: px + 0.3, y: py + 0.55, w: pw - 0.6, h: 0.85, fontSize: 44, fontFace: F.bold });
    T(s, "An AI money assistant that turns a pharmacy's paper into clear numbers, early warnings and the cheapest way to pay every bill.",
      { x: px + 0.3, y: py + 1.45, w: pw - 0.6, h: 1.2, fontSize: 13, fontFace: F.semi, color: K.white });
    s.addShape(pres.shapes.RECTANGLE, { x: px + 0.3, y: py + 2.85, w: 1.45, h: 0.3, fill: { color: K.orange }, line: { color: K.orange, width: 0 } });
    T(s, "WHY IT WINS", { x: px + 0.3, y: py + 2.85, w: 1.45, h: 0.3, fontSize: 10, fontFace: F.bold, color: K.white, align: "center", valign: "middle" });
    T(s, "Built for pharmacies, not generic bookkeeping. Works with every supplier, not one distributor.",
      { x: px + 0.3, y: py + 3.2, w: pw - 0.6, h: 0.55, fontSize: 10.5, color: K.white });

    const rows = [
      ["FaCamera", "Paper to accounts", "Snap invoices. AI turns them into clear accounts."],
      ["FaBell", "Early warnings", "Alerts before cash runs short or stock expires."],
      ["FaCoins", "Cheapest money first", "Trapped cash and free supplier days before any loan."],
      ["FaIdCard", "A card for families", "Customers see what they owe and pay weekly."],
    ];
    for (const [i, [ic, h, b]] of rows.entries()) {
      const x = 4.75, y = py + i * 0.99, w = XW + X0 - x;
      card(s, x, y, w, 0.87);
      await tile(s, x + 0.15, y + 0.13, ic, 0.6);
      T(s, h, { x: x + 0.95, y: y + 0.12, w: w - 1.1, h: 0.3, fontSize: 13, fontFace: F.semi, color: K.navy });
      T(s, b, { x: x + 0.95, y: y + 0.44, w: w - 1.1, h: 0.35, fontSize: 10.5, color: K.ink });
    }
  }

  // 4. How it works, in general: five steps, each ending in its outcome.
  {
    const s = page("How it works");
    const steps = [
      ["SNAP", "Photograph invoices and the sales book.", "No typing"],
      ["CHECK", "AI reads every line. The owner confirms.", "Accurate records"],
      ["SEE", "Profit, cash, bills and expiry on one screen.", "No surprises"],
      ["ASK", "Answers and next steps in plain words.", "Clear decisions"],
      ["APPROVE", "The owner approves every step.", "Owner in control"],
    ];
    const w = 1.66, gap = 0.2, y = 1.02, d = 0.44;
    line(s, X0 + w / 2, y + d / 2, 4 * (w + gap), 0, K.orange, 1.5);
    const check = await icon("FaCheck", K.orange);
    steps.forEach(([h, b, out], i) => {
      const x = X0 + i * (w + gap);
      dot(s, x + (w - d) / 2, y, i + 1, d);
      card(s, x, y + 0.62, w, 2.25);
      T(s, h, { x: x + 0.12, y: y + 0.76, w: w - 0.24, h: 0.32, fontSize: 14, fontFace: F.bold, color: K.navy, align: "center" });
      T(s, b, { x: x + 0.15, y: y + 1.12, w: w - 0.3, h: 0.9, fontSize: 11, align: "center" });
      line(s, x + 0.25, y + 2.15, w - 0.5, 0, K.orange, 0.75);
      T(s, "OUTCOME", { x: x + 0.12, y: y + 2.22, w: w - 0.24, h: 0.2, fontSize: 8, fontFace: F.bold, color: K.grey, align: "center" });
      s.addImage({ data: check, x: x + 0.2, y: y + 2.47, w: 0.18, h: 0.18 });
      T(s, out, { x: x + 0.42, y: y + 2.42, w: w - 0.52, h: 0.28, fontSize: 10.5, fontFace: F.semi, color: K.orange, valign: "middle" });
    });
    card(s, X0, 4.1, XW, 0.62, K.navy);
    T(s, "AI reads and explains   ·   Code does all the money math   ·   The owner stays in control",
      { x: X0 + 0.25, y: 4.1, w: XW - 0.5, h: 0.62, fontSize: 12.5, fontFace: F.semi, color: K.white, align: "center", valign: "middle" });
  }

  // 5. Try it live
  // Pitch style like slides 2-4: QR panel on the left, ways in, the demo video and why it matters on the right.
  {
    const s = page("Try it live");
    const px = X0, py = TOP, pw = 4.0, ph = 3.87;
    card(s, px, py, pw, ph, K.navy);
    T(s, "SCAN TO TRY LaMP", { x: px, y: py + 0.45, w: pw, h: 0.3, fontSize: 11, fontFace: F.bold, color: K.tint, align: "center" });
    const qr = await QRCode.toDataURL(LIVE_URL, { margin: 1, width: 600, errorCorrectionLevel: "M", color: { dark: "#" + K.navy, light: "#FFFFFF" } });
    const q = 1.95, qx = px + (pw - q) / 2, qy = py + 0.88;
    card(s, qx - 0.08, qy - 0.08, q + 0.16, q + 0.16, K.white);
    s.addImage({ data: qr.replace(/^data:/, ""), x: qx, y: qy, w: q, h: q, hyperlink: { url: LIVE_URL } });
    T(s, LIVE_URL.replace(/^https:\/\//, ""), { x: px, y: py + 3.04, w: pw, h: 0.35, fontSize: 14, fontFace: F.semi, color: K.white, align: "center", hyperlink: { url: LIVE_URL } });

    const rx = 4.75, rw = XW + X0 - rx;
    T(s, "TWO WAYS IN", { x: rx, y: py, w: rw, h: 0.28, fontSize: 12, fontFace: F.bold, color: K.navy });
    const logins = [
      ["FaStore", "PHARMACY OWNER", "Opens straight away", "Green Life Pharmacy, Bogura"],
      ["FaIdCard", "CUSTOMER", "Add /me to the link", "then enter card GL-7KQM-4XPA"],
    ];
    // Three boxes (two logins, the demo) fill the height of the QR panel.
    const bh = 1.05, bgap = 0.19, by = (i) => 1.32 + i * (bh + bgap);
    for (const [i, [ic, who, how, more]] of logins.entries()) {
      const y = by(i);
      card(s, rx, y, rw, bh);
      await tile(s, rx + 0.18, y + 0.22, ic, 0.61);
      T(s, who, { x: rx + 0.98, y: y + 0.16, w: rw - 1.13, h: 0.22, fontSize: 9.5, fontFace: F.bold, color: K.purple });
      T(s, how, { x: rx + 0.98, y: y + 0.38, w: rw - 1.13, h: 0.32, fontSize: 15, fontFace: F.semi, color: K.navy });
      T(s, more, { x: rx + 0.98, y: y + 0.7, w: rw - 1.13, h: 0.24, fontSize: 10.5, color: K.grey });
    }
    // The live demo video is shown right after this slide.
    const dy = by(2);
    card(s, rx, dy, rw, bh, K.orange);
    s.addShape(pres.shapes.OVAL, { x: rx + 0.18, y: dy + 0.22, w: 0.61, h: 0.61, fill: { color: K.white }, line: { color: K.white, width: 0 } });
    s.addImage({ data: await icon("FaPlay", K.orange), x: rx + 0.41, y: dy + 0.38, w: 0.22, h: 0.29, hyperlink: { url: DEMO_URL } });
    T(s, [
      { text: "LIVE DEMO", options: { fontFace: F.bold, fontSize: 15, breakLine: true, hyperlink: { url: DEMO_URL } } },
      { text: "Watch LaMP in action", options: { fontSize: 11.5, breakLine: true, hyperlink: { url: DEMO_URL } } },
      { text: DEMO_URL.replace(/^https:\/\/www\./, ""), options: { fontSize: 11.5, fontFace: F.semi, underline: { style: "sng" }, hyperlink: { url: DEMO_URL } } },
    ], { x: rx + 0.98, y: dy, w: rw - 1.13, h: bh, color: K.white, valign: "middle" });
  }

  const out = path.join(__dirname, "LaMP-AIgnite.pptx");
  await pres.writeFile({ fileName: out });
  // pptxgenjs writes empty folder entries into the zip; some cloud drives then refuse to open the file.
  // (JSZip's remove() on a folder also deletes its files, so copy the files into a fresh zip instead.)
  const src = await JSZip.loadAsync(fs.readFileSync(out));
  const clean = new JSZip();
  // Also: pptxgenjs gives every text box an empty outline (<a:ln></a:ln>), which Google Slides and
  // some PowerPoint versions draw as a thin blue line, so turn those outlines off. And swap the
  // stock Office blues in the theme (accent 1, link colors) for the deck's own colors.
  for (const [name, entry] of Object.entries(src.files)) {
    if (entry.dir) continue;
    let data = await entry.async("nodebuffer");
    if (/^ppt\/(slides|slideLayouts|slideMasters)\/[^/]+\.xml$/.test(name)) {
      data = Buffer.from(data.toString("utf8").replace(/<a:ln><\/a:ln>|<a:ln\/>/g, "<a:ln><a:noFill/></a:ln>"), "utf8");
    } else if (/^ppt\/theme\/theme\d+\.xml$/.test(name)) {
      data = Buffer.from(data.toString("utf8")
        .replace(/<a:accent1>.*?<\/a:accent1>/, `<a:accent1><a:srgbClr val="${K.navy}"/></a:accent1>`)
        .replace(/<a:hlink>.*?<\/a:hlink>/, `<a:hlink><a:srgbClr val="${K.orange}"/></a:hlink>`)
        .replace(/<a:folHlink>.*?<\/a:folHlink>/, `<a:folHlink><a:srgbClr val="${K.orange}"/></a:folHlink>`), "utf8");
    }
    clean.file(name, data, { createFolders: false });
  }
  fs.writeFileSync(out, await clean.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("wrote LaMP-AIgnite.pptx");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
