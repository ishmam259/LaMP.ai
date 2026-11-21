"""Make the demo's digital supplier invoice (python video/assets/make_invoice_pdf.py).

A one-page A4 PDF, the kind a distributor emails, for the Scan step of the feature demo. Lines
add up, and it falls due after the 30-day cash view, so saving it leaves the demo's numbers
unchanged. Rendered by the browser (Microsoft Edge through Playwright)."""
import os

from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "invoice_supplier_k.pdf")

LINES = [
    ("Omeprazole 20 mg, box of 50", "OM2611", "05/2028", 12, 480),
    ("Amoxicillin 500 mg, box of 50", "AX2609", "09/2027", 8, 600),
    ("Oral saline, box of 25", "OR2606", "06/2027", 20, 300),
]

rows = "".join(
    f"<tr><td>{i}</td><td>{p}</td><td>{b}</td><td>{e}</td><td class=n>{q}</td><td class=n>{u:,.2f}</td>"
    f"<td class=n>{q * u:,.2f}</td></tr>"
    for i, (p, b, e, q, u) in enumerate(LINES, 1)
)
total = sum(q * u for *_, q, u in LINES)

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
  @page {{ size: A4; margin: 18mm 16mm; }}
  body {{ font-family: "Segoe UI", Arial, sans-serif; color: #1d2722; font-size: 11pt; }}
  .top {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f6b4f; padding-bottom: 10px; }}
  h1 {{ margin: 0; font-size: 20pt; color: #0f6b4f; }}
  .muted {{ color: #5b6b63; font-size: 9.5pt; line-height: 1.45; }}
  .title {{ text-align: right; }}
  .title h2 {{ margin: 0; font-size: 16pt; letter-spacing: .08em; }}
  .meta {{ display: flex; justify-content: space-between; margin: 18px 0; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 6px; }}
  th {{ background: #eef4f1; text-align: left; font-size: 9.5pt; padding: 7px 8px; border-bottom: 1px solid #c9d6cf; }}
  td {{ padding: 8px; border-bottom: 1px solid #e3ebe7; }}
  .n {{ text-align: right; white-space: nowrap; }}
  .tot td {{ border: 0; font-weight: 700; font-size: 12pt; padding-top: 12px; }}
  .foot {{ margin-top: 40px; display: flex; justify-content: space-between; }}
</style></head><body>
  <div class="top">
    <div><h1>Supplier K</h1>
      <div class="muted">Pharmaceutical distributor<br>Station Road, Bogura<br>Drug licence no. DL-BG-20417</div></div>
    <div class="title"><h2>INVOICE</h2><div class="muted">Invoice no. <b>K-77412</b></div></div>
  </div>
  <div class="meta">
    <div><div class="muted">Bill to</div><b>Green Life Pharmacy</b><div class="muted">Satmatha, Bogura</div></div>
    <div style="text-align:right"><div>Invoice date: <b>16 Oct 2026</b></div><div>Payment due: <b>30 Nov 2026</b></div></div>
  </div>
  <table>
    <tr><th>#</th><th>Product</th><th>Batch</th><th>Expiry</th><th class=n>Boxes</th><th class=n>Price per box (BDT)</th><th class=n>Amount (BDT)</th></tr>
    {rows}
    <tr class="tot"><td colspan=6 class=n>Total (BDT)</td><td class=n>{total:,.2f}</td></tr>
  </table>
  <div class="foot muted"><div>Goods once sold are returnable before expiry as per company policy.</div><div>Authorised signature</div></div>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge")
    pg = b.new_page()
    pg.set_content(HTML)
    pg.pdf(path=OUT, format="A4", print_background=True)
    b.close()
print(OUT, f"total BDT {total:,}")
