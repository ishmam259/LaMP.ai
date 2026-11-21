"""Record the short demo against the local app (python video/record_short.py <out_dir> [channel]).

Only the main features, on a phone screen (390x844 at 2x): Today, Cash, Scan (a photo of the bill),
Stock, Plan, Ask LaMP, Approvals and Customers in owner.mp4, then the customer's card in phone.mp4.
video/make_short.py cuts them into the film. Same setup and recording method as
record_features.py: API on :8000 (DEV_MODE, replay), production build of the frontend on :3000.

Scan opens the in-app camera. The browser's fake camera plays assets/camera_invoice.mjpeg, a photo
of the printed Supplier K bill on a counter (made by assets/make_camera_feed.py). A camera frame is
never byte-for-byte the same, so the upload is swapped for the same bill as a PDF, whose reading
is already recorded: no OpenAI call."""
import os
import uuid

from record_features import (INVOICE, PHONE, ROOT, Take, click, hold, more, move_to, page_scroll, phone, record,
                             scroll, shot, tab, try_click, visible, APP)

FEED = os.path.abspath(os.path.join(ROOT, "video", "assets", "camera_invoice.mjpeg"))  # the browser rejects ".." in it
CAMERA = ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
          f"--use-file-for-fake-video-capture={FEED}"]


# The recorded reading comes back at once; hold the "Reading…" state about as long as a real one takes.
READING = """(() => { const f = window.fetch; window.fetch = async (u, o) => {
  if (String(u).includes('/captures') && o && o.method === 'POST') await new Promise(r => setTimeout(r, 2200 / (window.__RATE || 1)));
  return f(u, o); }; })();"""


def same_bill(route):
    """Send the recorded PDF of the bill in place of the camera photo."""
    boundary = uuid.uuid4().hex
    with open(INVOICE, "rb") as f:
        pdf = f.read()
    head = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo.pdf"\r\n'
            f'Content-Type: application/pdf\r\n\r\n')
    tail = (f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\ninvoice\r\n'
            f'--{boundary}--\r\n')
    body = head.encode() + pdf + tail.encode()
    headers = {k: v for k, v in route.request.headers.items() if k.lower() not in ("content-type", "content-length")}
    route.continue_(post_data=body, headers={**headers, "content-type": f"multipart/form-data; boundary={boundary}"})


def owner(b):
    t = Take(b, "owner", PHONE, scale=2, mobile=True); pg = t.pg
    t.ctx.grant_permissions(["camera"], origin=APP)
    t.ctx.add_init_script(READING)
    try:
        pg.goto(APP + "/", wait_until="load")
        visible(pg, pg.get_by_text("Short BDT").first)
        pg.mouse.move(195, 560); hold(pg, 600)
        t.mark("today")
        hold(pg, 4000); shot(pg, "s01_today")
        page_scroll(pg, 520, 3000); scroll(pg, -520); hold(pg, 600)

        t.mark("cash")
        tab(pg, "Cash", 3000); shot(pg, "s01b_cash")
        page_scroll(pg, 600, 2800); page_scroll(pg, 700, 2800); scroll(pg, -1300); hold(pg, 400)

        t.mark("scan")
        tab(pg, "Scan", 1500)
        pg.route("**/captures", lambda r: same_bill(r) if r.request.method == "POST" else r.continue_())
        click(pg, pg.get_by_role("button", name="Take a photo"), 0)
        visible(pg, pg.get_by_text("Fit the whole page in the frame"), 15000)
        t.mark("camera")
        hold(pg, 3500); shot(pg, "s02a_camera")
        click(pg, pg.get_by_role("button", name="Take the photo"), 0)
        t.mark("shot")
        visible(pg, pg.get_by_role("button", name="Save to accounts"), 60000)
        t.mark("scan_read")
        hold(pg, 3000); shot(pg, "s02_scan")
        page_scroll(pg, 450, 2500)
        if try_click(pg, pg.get_by_role("button", name="Save to accounts"), 2000):
            t.mark("scan_saved")

        t.mark("stock")
        tab(pg, "Stock", 3500); shot(pg, "s03_stock")
        page_scroll(pg, 600, 3000); scroll(pg, -600); hold(pg, 400)

        t.mark("plan")
        tab(pg, "Plan", 4000); shot(pg, "s04_plan")
        page_scroll(pg, 520, 3500)
        t.mark("plan_cost")
        page_scroll(pg, 650, 3500); scroll(pg, -1170); hold(pg, 500)

        t.mark("chat")
        click(pg, pg.get_by_role("button", name="Ask", exact=True).locator("visible=true").first, 1200)
        click(pg, pg.get_by_role("button", name="Can I pay Supplier A's order next week?"), 600)
        busy = pg.get_by_text("LaMP is checking your figures")
        try:
            busy.wait_for(state="visible", timeout=10000)
        except Exception:
            pass
        busy.wait_for(state="hidden", timeout=60000)
        t.mark("chat_answer")
        hold(pg, 7000); shot(pg, "s05_chat")
        pg.keyboard.press("Escape"); hold(pg, 800)

        t.mark("approvals")
        # its name carries the waiting count, so not an exact match
        click(pg, pg.get_by_role("link", name="Approvals").locator("visible=true").first, 2500); shot(pg, "s06_approvals")
        for _ in range(3):
            card = pg.locator("li").filter(has=pg.get_by_role("button", name="Approve", exact=True))
            if card.count() == 0 or not try_click(pg, card.first.get_by_role("button", name="Approve", exact=True), 2500):
                break
        t.mark("approved")
        page_scroll(pg, 500, 3500); shot(pg, "s07_approved")

        t.mark("customers")
        more(pg, "Customers", 3000); shot(pg, "s08_customers")
        if pg.get_by_text("4 parts from").count():
            move_to(pg, pg.get_by_text("4 parts from").first, 2500)
        page_scroll(pg, 500, 2800); scroll(pg, -500); hold(pg, 600)
        t.mark("end")
    finally:
        t.finish()


if __name__ == "__main__":
    record((owner, phone), CAMERA)
