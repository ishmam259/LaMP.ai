"""Record the AIgnite demo against the local app (python video/record_aignite.py <out_dir> [channel]).

Needs the API on :8000 (DEV_MODE, replay) and the frontend on :3000. Writes three Playwright videos
with scene marks: owner.webm (1920x1080), phone.webm (390x844 customer card), owner_end.webm, and
scenes_<take>.json (scene start times in seconds). video/make_aignite.py turns them into the film."""
import json, os, shutil, sys, time
import httpx
from playwright.sync_api import sync_playwright

OUT = sys.argv[1]
# A signed browser channel ("msedge" by default): Windows Smart App Control can block Playwright's own Chromium.
CHANNEL = sys.argv[2] if len(sys.argv) > 2 else "msedge"
os.makedirs(OUT, exist_ok=True)
APP, API = "http://localhost:3000", "http://127.0.0.1:8000/api/v1"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
INVOICE = os.path.join(ROOT, "eval", "images", "e01_invoice.jpg")
CARD = "GL-7KQM-4XPA"

# A visible cursor (arrow on desktop, a fingertip dot on the phone) and a ring on each click.
CURSOR = r"""
(() => {
  const add = () => {
    if (document.getElementById('__cur')) return;
    const phone = innerWidth < 600;
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = phone ? '<div style="width:30px;height:30px;border-radius:50%;background:rgba(20,20,20,.28);border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 1px rgba(0,0,0,.25)"></div>' : '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.8L4 20z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {position:'fixed', left:'0px', top:'0px', zIndex:2147483647, pointerEvents:'none', transform: phone ? 'translate(-15px,-15px)' : 'translate(-3px,-2px)'});
    const r = document.createElement('div'); r.id = '__ring';
    Object.assign(r.style, {position:'fixed', width:'36px', height:'36px', borderRadius:'50%', border:'3px solid #f5b400', zIndex:2147483646, pointerEvents:'none', opacity:0, transform:'translate(-18px,-18px) scale(.4)'});
    document.documentElement.append(c, r);
    const pos = (window.__curpos || {x: innerWidth / 2, y: innerHeight * 0.65}); c.style.left = pos.x + 'px'; c.style.top = pos.y + 'px';
    addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; window.__curpos = {x: e.clientX, y: e.clientY}; }, true);
    addEventListener('mousedown', e => { r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; r.style.transition = 'none'; r.style.opacity = 1; r.style.transform = 'translate(-18px,-18px) scale(.4)';
      requestAnimationFrame(() => { r.style.transition = 'opacity .45s, transform .45s'; r.style.opacity = 0; r.style.transform = 'translate(-18px,-18px) scale(1.4)'; }); }, true);
    const st = document.createElement('style'); st.textContent = 'nextjs-portal{display:none!important}'; document.head.append(st);
  };
  try { localStorage.setItem('lamp:notify-asked', '1'); } catch {}  // no desktop-alerts prompt on screen
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', add); else add();
})();
"""

scenes, T0 = [], None


def mark(name):
    t = round(time.monotonic() - T0, 2)
    scenes.append({"t": t, "scene": name}); print(f"{t:7.2f}  {name}", flush=True)


def shot(pg, name):
    pg.screenshot(path=os.path.join(OUT, name + ".png"))


def hold(pg, ms):
    pg.wait_for_timeout(ms)


def move_to(pg, loc, settle=350):
    loc.scroll_into_view_if_needed(); pg.wait_for_timeout(250)
    bb = loc.bounding_box()
    pg.mouse.move(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2, steps=28)
    pg.wait_for_timeout(settle)


def click(pg, loc, after=900):
    try:
        loc.wait_for(state="visible", timeout=30000)
    except Exception:
        shot(pg, "FAIL"); raise
    move_to(pg, loc)
    pg.mouse.down(); pg.wait_for_timeout(90); pg.mouse.up()
    pg.wait_for_timeout(after)


def nav(pg, label, after=2200):
    click(pg, pg.get_by_role("link", name=label, exact=True).locator("visible=true").last, after)


def scroll(pg, dy, steps=14, ms=60):
    for _ in range(steps):
        pg.mouse.wheel(0, dy / steps); pg.wait_for_timeout(ms)
    pg.wait_for_timeout(500)


def type_slow(pg, loc, text, delay=160):
    click(pg, loc, 200); loc.press_sequentially(text, delay=delay)


def start(b, name, viewport, size, mobile=False):
    global T0
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    ctx = b.new_context(viewport=viewport, record_video_dir=d, record_video_size=size,
                        device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=False)
    ctx.add_init_script(CURSOR)
    pg = ctx.new_page(); T0 = time.monotonic(); scenes.clear()
    return ctx, pg


def finish(ctx, pg, name):
    video = pg.video; ctx.close()
    shutil.move(video.path(), os.path.join(OUT, name + ".webm"))
    json.dump(scenes, open(os.path.join(OUT, f"scenes_{name}.json"), "w"), indent=1)


def owner(b):
    ctx, pg = start(b, "owner", {"width": 1920, "height": 1080}, {"width": 1920, "height": 1080})
    try:
        pg.goto(APP + "/", wait_until="load")
        pin = pg.get_by_label("Owner PIN"); pin.wait_for(timeout=30000)
        pg.mouse.move(960, 760); hold(pg, 800)
        mark("pin")
        hold(pg, 2500)
        type_slow(pg, pin, "2468", 260); hold(pg, 300)
        if pin.is_visible(): pin.press("Enter")
        pg.get_by_text("Short BDT").first.wait_for(timeout=30000)
        mark("today")
        hold(pg, 3500); shot(pg, "o1_today")
        scroll(pg, 420); hold(pg, 2500); scroll(pg, -420); hold(pg, 800)

        mark("capture")
        nav(pg, "Capture", 1500)
        with pg.expect_file_chooser() as fc:
            click(pg, pg.get_by_role("button", name="Take or choose a photo"), 0)
        fc.value.set_files(INVOICE)
        pg.get_by_role("button", name="Save to accounts").wait_for(timeout=60000)
        hold(pg, 2500); shot(pg, "o2_capture")
        scroll(pg, 450); hold(pg, 3000); scroll(pg, -450); hold(pg, 600)

        mark("funding")
        nav(pg, "Funding", 3500); shot(pg, "o3_funding")
        mark("funding_cost")
        scroll(pg, 380); hold(pg, 4500)

        mark("chat")
        click(pg, pg.get_by_role("button", name="Ask LaMP"), 1200)
        click(pg, pg.get_by_role("button", name="Can I pay Supplier A's order next week?"), 600)
        busy = pg.get_by_text("LaMP is checking your figures")
        try:
            busy.wait_for(state="visible", timeout=10000)
        except Exception:
            pass
        busy.wait_for(state="hidden", timeout=60000)
        hold(pg, 7500); shot(pg, "o4_chat")
        pg.keyboard.press("Escape"); hold(pg, 1000)

        # The chat's answer already put the plan's steps in Actions, suggested by LaMP.
        mark("approve")
        click(pg, pg.get_by_role("link", name="Actions").locator("visible=true").first, 2500); shot(pg, "o5_actions")
        for _ in range(2):
            card = pg.locator("li").filter(has=pg.get_by_role("button", name="Approve", exact=True)).filter(has_not_text="needs your PIN")
            if card.count() == 0: break
            click(pg, card.first.get_by_role("button", name="Approve", exact=True), 3000)
        scroll(pg, 350); hold(pg, 3500); shot(pg, "o6_saved")
        mark("end")
    finally:
        finish(ctx, pg, "owner")


def phone(b):
    # Recorded at the viewport size: Playwright doesn't scale a page up to a bigger video.
    ctx, pg = start(b, "phone", {"width": 390, "height": 844}, {"width": 390, "height": 844}, mobile=True)
    try:
        pg.goto(APP + "/me", wait_until="load")
        pg.get_by_role("button", name="Try a demo card").wait_for(timeout=30000)
        pg.mouse.move(195, 600); hold(pg, 600)
        mark("customer_home")
        hold(pg, 2500)
        field = pg.get_by_label("Card code")
        type_slow(pg, field, CARD, 120); hold(pg, 500)
        click(pg, pg.get_by_role("button", name="Open", exact=True), 0)
        pg.get_by_text("You owe", exact=True).wait_for(timeout=30000)
        mark("customer_card")
        hold(pg, 3000); shot(pg, "p1_card")
        click(pg, pg.get_by_text("4 weekly parts of BDT 1,625"), 800)
        mark("customer_plan")
        hold(pg, 1500)
        click(pg, pg.get_by_role("button", name="Promise this plan"), 0)
        pg.get_by_text("Your plan", exact=True).wait_for(timeout=30000)
        mark("customer_saved")
        hold(pg, 4500); shot(pg, "p2_plan")
        mark("end")
    finally:
        finish(ctx, pg, "phone")


def owner_end(b):
    ctx, pg = start(b, "owner_end", {"width": 1920, "height": 1080}, {"width": 1920, "height": 1080})
    try:
        pg.goto(APP + "/", wait_until="load")
        pin = pg.get_by_label("Owner PIN"); pin.wait_for(timeout=30000)
        pin.press_sequentially("2468", delay=40)
        pin.wait_for(state="hidden", timeout=30000)
        pg.goto(APP + "/customers", wait_until="load")
        pg.get_by_text("Owed to you").wait_for(timeout=30000)
        pg.mouse.move(1100, 700); hold(pg, 1200)
        mark("owner_customers")
        hold(pg, 1500)
        move_to(pg, pg.get_by_text("4 parts from").first, 3500); shot(pg, "e1_customers")
        mark("owner_log")
        nav(pg, "Activity log", 4500); shot(pg, "e2_log")
        mark("end")
    finally:
        finish(ctx, pg, "owner_end")


httpx.post(f"{API}/dev/reset?with_demo_captures=true", timeout=60).raise_for_status()
with sync_playwright() as p:
    b = p.chromium.launch(channel=CHANNEL, args=["--force-color-profile=srgb"])
    for take in (owner, phone, owner_end):
        take(b)
    b.close()
