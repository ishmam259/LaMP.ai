"""Record the AIgnite demo against the local app at 60 fps (python video/record_aignite.py <out_dir> [channel]).

Needs the API on :8000 (DEV_MODE, replay) and the frontend on :3000 (a production build: no dev
overlay, smoother). Frames come straight from the browser's screencast. The browser can't send a
full 1080p frame every 1/60 s, so each take is played at 1/SLOW speed (the cursor, scrolling,
waits, typing and the page's own CSS animations) and its frames are retimed SLOW times faster:
every frame of the 60 fps result is a real one. Takes are encoded to <take>.mp4: owner.mp4
(1920x1080), phone.mp4 (390x844 customer card at 2x), owner_end.mp4. Scene start times go to
scenes_<take>.json in seconds of the result. video/make_aignite.py turns them into the film."""
import base64, json, os, shutil, subprocess, sys, time
import httpx
from playwright.sync_api import sync_playwright

OUT = os.path.abspath(sys.argv[1])
# A signed browser channel ("msedge" by default): Windows Smart App Control can block Playwright's own Chromium.
CHANNEL = sys.argv[2] if len(sys.argv) > 2 else "msedge"
os.makedirs(OUT, exist_ok=True)
APP, API = "http://localhost:3000", "http://127.0.0.1:8000/api/v1"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
INVOICE = os.path.join(ROOT, "eval", "images", "e01_invoice.jpg")
CARD = "GL-7KQM-4XPA"
FPS = 60
SLOW = 3  # record at a third of real speed

# A visible cursor (arrow on desktop, a fingertip dot on the phone) and a ring on each click.
# __glide and __scroll animate on requestAnimationFrame, so every 60 fps frame moves a little.
CURSOR = r"""
(() => {
  try { localStorage.setItem('lamp:notify-asked', '1'); } catch {}  // no desktop-alerts prompt on screen
  // The page's own CSS animations and transitions at the recording speed (window.__RATE).
  const rate = window.__RATE || 1;
  if (rate !== 1) {
    const tick = () => { for (const a of document.getAnimations()) if (a.playbackRate !== rate) a.playbackRate = rate; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const animate = (ms, f) => new Promise((done) => {
    const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / ms); f(ease(k)); k < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  });
  const pos = () => { try { return JSON.parse(sessionStorage.getItem('__curpos')); } catch { return null; } };
  const save = (p) => { try { sessionStorage.setItem('__curpos', JSON.stringify(p)); } catch {} };
  const add = () => {
    if (document.getElementById('__cur')) return;
    const phone = innerWidth < 600;
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = phone ? '<div style="width:30px;height:30px;border-radius:50%;background:rgba(20,20,20,.28);border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 1px rgba(0,0,0,.25)"></div>' : '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.8L4 20z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {position:'fixed', left:'0px', top:'0px', zIndex:2147483647, pointerEvents:'none', transform: phone ? 'translate(-15px,-15px)' : 'translate(-3px,-2px)'});
    const r = document.createElement('div'); r.id = '__ring';
    Object.assign(r.style, {position:'fixed', width:'36px', height:'36px', borderRadius:'50%', border:'3px solid #f5b400', zIndex:2147483646, pointerEvents:'none', opacity:0, transform:'translate(-18px,-18px) scale(.4)'});
    document.documentElement.append(c, r);
    const p = pos() || {x: innerWidth / 2, y: innerHeight * 0.65};
    c.style.left = p.x + 'px'; c.style.top = p.y + 'px';
    addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; save({x: e.clientX, y: e.clientY}); }, true);
    addEventListener('mousedown', e => { r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; r.style.transition = 'none'; r.style.opacity = 1; r.style.transform = 'translate(-18px,-18px) scale(.4)';
      requestAnimationFrame(() => { r.style.transition = 'opacity .45s, transform .45s'; r.style.opacity = 0; r.style.transform = 'translate(-18px,-18px) scale(1.4)'; }); }, true);
  };
  window.__glide = (x, y, ms) => {
    const c = document.getElementById('__cur'); const from = pos() || {x: innerWidth / 2, y: innerHeight * 0.65};
    return animate(ms, (e) => { const p = {x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e}; c.style.left = p.x + 'px'; c.style.top = p.y + 'px'; save(p); });
  };
  window.__scroll = (dy, ms) => { const y0 = scrollY; return animate(ms, (e) => scrollTo(0, y0 + dy * e)); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', add); else add();
})();
"""


class Take:
    """One recorded take: a page whose screencast frames are saved with their times."""

    def __init__(self, b, name, viewport, scale=1, mobile=False):
        self.name, self.dir = name, os.path.join(OUT, f"{name}_frames")
        shutil.rmtree(self.dir, ignore_errors=True); os.makedirs(self.dir)
        self.ctx = b.new_context(viewport=viewport, device_scale_factor=scale, is_mobile=mobile, has_touch=False)
        self.ctx.add_init_script(f"window.__RATE = {1 / SLOW};")
        self.ctx.add_init_script(CURSOR)
        self.pg = self.ctx.new_page()
        self.frames, self.scenes = [], []
        self.cdp = self.ctx.new_cdp_session(self.pg)
        self.cdp.on("Page.screencastFrame", self._frame)
        self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 90, "everyNthFrame": 1,
                                               "maxWidth": viewport["width"] * scale, "maxHeight": viewport["height"] * scale})

    def _frame(self, ev):
        path = os.path.join(self.dir, f"{len(self.frames):06d}.jpg")
        with open(path, "wb") as f:
            f.write(base64.b64decode(ev["data"]))
        self.frames.append((ev["metadata"]["timestamp"], os.path.basename(path)))
        self.cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})

    def mark(self, scene):
        self.scenes.append({"t": time.time(), "scene": scene}); print(f"{self.name:9s} {scene}", flush=True)

    def finish(self):
        """Encode the frames at a constant 60 fps, each held until the next one arrived, SLOW times faster."""
        hold(self.pg, 300)
        self.cdp.send("Page.stopScreencast")
        end = time.time()
        self.ctx.close()
        t0 = self.frames[0][0]
        lines = []
        for (t, f), nxt in zip(self.frames, [t for t, _ in self.frames[1:]] + [end]):
            lines += [f"file '{f}'", f"duration {max(nxt - t, 0.001) / SLOW:.6f}"]
        lines.append(f"file '{self.frames[-1][1]}'")
        with open(os.path.join(self.dir, "frames.txt"), "w") as fh:
            fh.write("\n".join(lines) + "\n")
        out = os.path.join(OUT, f"{self.name}.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "frames.txt",
                        "-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-crf", "14", "-preset", "fast", out],
                       cwd=self.dir, check=True)
        json.dump([{"t": round((s["t"] - t0) / SLOW, 3), "scene": s["scene"]} for s in self.scenes],
                  open(os.path.join(OUT, f"scenes_{self.name}.json"), "w"), indent=1)
        gaps = sorted(b - a for (a, _), (b, _) in zip(self.frames, self.frames[1:]))
        print(f"{self.name}: {len(self.frames)} frames, median gap {gaps[len(gaps) // 2] * 1000 / SLOW:.0f} ms "
              f"(90% under {gaps[int(len(gaps) * 0.9)] * 1000 / SLOW:.0f} ms) -> {out}")
        shutil.rmtree(self.dir)


def shot(pg, name):
    pg.screenshot(path=os.path.join(OUT, name + ".png"))


def hold(pg, ms):
    """Wait ms of the finished film's time."""
    pg.wait_for_timeout(ms * SLOW)


def move_to(pg, loc, settle=250):
    """Glide the cursor to the middle of loc, then put the real mouse there (for hover)."""
    loc.scroll_into_view_if_needed(); hold(pg, 200)
    bb = loc.bounding_box()
    x, y = bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2
    start = pg.evaluate("() => { try { return JSON.parse(sessionStorage.getItem('__curpos')); } catch { return null; } }") or {"x": x, "y": y}
    dist = ((x - start["x"]) ** 2 + (y - start["y"]) ** 2) ** 0.5
    pg.evaluate("([x, y, ms]) => window.__glide(x, y, ms)", [x, y, min(1000, max(420, 300 + dist * 0.45)) * SLOW])
    pg.mouse.move(x, y)
    hold(pg, settle)


def click(pg, loc, after=900):
    try:
        loc.wait_for(state="visible", timeout=30000)
    except Exception:
        shot(pg, "FAIL"); raise
    move_to(pg, loc)
    pg.mouse.down(); hold(pg, 90); pg.mouse.up()
    hold(pg, after)


def nav(pg, label, after=2200):
    click(pg, pg.get_by_role("link", name=label, exact=True).locator("visible=true").last, after)


def scroll(pg, dy, ms=1100):
    pg.evaluate("([dy, ms]) => window.__scroll(dy, ms)", [dy, ms * SLOW]); hold(pg, 350)


def type_slow(pg, loc, text, delay=160):
    click(pg, loc, 200); loc.press_sequentially(text, delay=delay * SLOW)


def owner(b):
    t = Take(b, "owner", {"width": 1920, "height": 1080}); pg = t.pg
    try:
        pg.goto(APP + "/", wait_until="load")
        pin = pg.get_by_label("Owner PIN"); pin.wait_for(timeout=30000)
        hold(pg, 800)
        t.mark("pin")
        hold(pg, 2500)
        type_slow(pg, pin, "2468", 260); hold(pg, 300)
        if pin.is_visible(): pin.press("Enter")
        pg.get_by_text("Short BDT").first.wait_for(timeout=30000)
        t.mark("today")
        hold(pg, 3500); shot(pg, "o1_today")
        scroll(pg, 420); hold(pg, 2500); scroll(pg, -420); hold(pg, 800)

        t.mark("capture")
        nav(pg, "Scan", 1500)
        with pg.expect_file_chooser() as fc:
            click(pg, pg.get_by_role("button", name="Take or choose a photo"), 0)
        fc.value.set_files(INVOICE)
        pg.get_by_role("button", name="Save to accounts").wait_for(timeout=60000)
        hold(pg, 2500); shot(pg, "o2_capture")
        scroll(pg, 450); hold(pg, 3000); scroll(pg, -450); hold(pg, 600)

        t.mark("funding")
        nav(pg, "Plan", 3500); shot(pg, "o3_funding")
        t.mark("funding_cost")
        scroll(pg, 380); hold(pg, 4500)

        t.mark("chat")
        click(pg, pg.get_by_role("button", name="Ask LaMP"), 1200)
        click(pg, pg.get_by_role("button", name="Can I pay Supplier A's order next week?"), 600)
        busy = pg.get_by_text("LaMP is checking your figures")
        try:
            busy.wait_for(state="visible", timeout=10000)
        except Exception:
            pass
        busy.wait_for(state="hidden", timeout=60000)
        hold(pg, 8500); shot(pg, "o4_chat")
        pg.keyboard.press("Escape"); hold(pg, 1000)

        # The chat's answer already put the plan's steps in Approvals, suggested by LaMP.
        t.mark("approve")
        click(pg, pg.get_by_role("link", name="Approvals").locator("visible=true").first, 2500); shot(pg, "o5_actions")
        for _ in range(2):
            card = pg.locator("li").filter(has=pg.get_by_role("button", name="Approve", exact=True)).filter(has_not_text="needs your PIN")
            if card.count() == 0: break
            click(pg, card.first.get_by_role("button", name="Approve", exact=True), 3000)
        scroll(pg, 350); hold(pg, 3500); shot(pg, "o6_saved")
        t.mark("end")
    finally:
        t.finish()


def phone(b):
    t = Take(b, "phone", {"width": 390, "height": 844}, scale=2, mobile=True); pg = t.pg
    try:
        pg.goto(APP + "/me", wait_until="load")
        pg.get_by_label("Card code").wait_for(timeout=30000)
        pg.mouse.move(195, 600); hold(pg, 600)
        t.mark("customer_home")
        hold(pg, 2500)
        field = pg.get_by_label("Card code")
        type_slow(pg, field, CARD, 120); hold(pg, 500)
        click(pg, pg.get_by_role("button", name="Open", exact=True), 0)
        pg.get_by_text("You owe", exact=True).wait_for(timeout=30000)
        t.mark("customer_card")
        hold(pg, 3000); shot(pg, "p1_card")
        click(pg, pg.get_by_text("4 weekly parts of BDT 1,625"), 800)
        t.mark("customer_plan")
        hold(pg, 1500)
        click(pg, pg.get_by_role("button", name="Promise this plan"), 0)
        pg.get_by_text("Your plan", exact=True).wait_for(timeout=30000)
        t.mark("customer_saved")
        hold(pg, 4500); shot(pg, "p2_plan")
        t.mark("end")
    finally:
        t.finish()


def owner_end(b):
    t = Take(b, "owner_end", {"width": 1920, "height": 1080}); pg = t.pg
    try:
        pg.goto(APP + "/", wait_until="load")
        pin = pg.get_by_label("Owner PIN"); pin.wait_for(timeout=30000)
        pin.press_sequentially("2468", delay=40)
        pin.wait_for(state="hidden", timeout=30000)
        pg.goto(APP + "/customers", wait_until="load")
        pg.get_by_text("Owed to you").wait_for(timeout=30000)
        pg.mouse.move(1100, 700); hold(pg, 1200)
        t.mark("owner_customers")
        hold(pg, 1500)
        move_to(pg, pg.get_by_text("4 parts from").first, 3500); shot(pg, "e1_customers")
        t.mark("owner_log")
        nav(pg, "History", 4500); shot(pg, "e2_log")
        t.mark("end")
    finally:
        t.finish()


httpx.post(f"{API}/dev/reset?with_demo_captures=true", timeout=60).raise_for_status()
with sync_playwright() as p:
    b = p.chromium.launch(channel=CHANNEL, args=["--force-color-profile=srgb"])
    for take in (owner, phone, owner_end):
        take(b)
    b.close()
