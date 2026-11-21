"""Cut the 2-minute demo (1920x1080, 60 fps) from record_short.py's takes, with English captions.

python video/make_short.py <takes_dir> <out.mp4>
The app plays inside a drawn phone on the right (status bar with the time, signal, Wi-Fi and
battery, a camera cut-out, side buttons, a home bar); the page name and a caption sit on the left. No title card
and no end card: it opens on Today and ends on the customer's card. Captions are timed against
the scene marks the recorder writes, so a new take keeps them in step. Needs ffmpeg and Pillow."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

REC, OUT = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
WORK = os.path.join(REC, "cut"); os.makedirs(WORK, exist_ok=True)
W, H, FPS = 1920, 1080, 60
FADE = 0.4      # seconds of crossfade between the two takes
TAIL = 1.5      # seconds the last frame holds before the film ends
GREEN, SIGNAL, MINT = (15, 77, 58), (255, 212, 0), (207, 232, 218)
FONT = {k: os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", f) for k, f in
        {"reg": "segoeui.ttf", "semi": "seguisb.ttf", "black": "seguibl.ttf"}.items()}
# The phone: a status bar on top of the app's 780x1688 frames, all inside a black body.
SW = 441                                    # screen width
SB = 66                                     # status bar height (59 of 393 points on a real phone)
VH = round(SW * 1688 / 780 / 2) * 2         # the app's height on screen
SH = SB + VH                                # whole screen height
SX, SY = 1424 - SW // 2, (H - SH) // 2      # screen's top-left corner
BEZ = 13                                    # black border around the screen
BODY = (SX - BEZ, SY - BEZ, SX + SW + BEZ, SY + SH + BEZ)
RADIUS = 62                                 # screen corner radius
INK = (17, 17, 17)
TEXT_X, TEXT_W = 150, 900

# (scene, seconds into it, page name, caption) per take; each runs until the next one.
CAPTIONS = {
    "owner": [
        ("today", 0, "Today", "Green Life Pharmacy will be BDT 19,000 short on 26 Oct, the day Supplier A's order is due."),
        ("cash", 0, "Cash", "Every payment coming up, day by day. Supplier A's BDT 60,000 order on 26 Oct takes the cash below zero."),
        ("scan", 0, "Scan", "A supplier's bill arrives on paper. The owner opens Scan."),
        ("camera", 0, "Scan", "The camera opens, and the owner takes a photo of the bill."),
        ("shot", 0, "Scan", "LaMP reads every line: product, batch, expiry date and price."),
        ("scan_read", 3, "Scan", "The lines match the photo. The owner checks them, then saves the bill."),
        ("stock", 0, "Stock", "Medicine about to expire, and the boxes on order that won't sell in time."),
        ("plan", 0, "Plan", "The cheapest way through, step by step: order fewer slow boxes, then ask Supplier A for more days."),
        ("plan_cost", 0, "Plan", "Borrowing it all would cost BDT 421.64. This plan costs BDT 0, or BDT 181.97 if the supplier says no."),
        ("chat", 0, "Ask LaMP", "Ask in plain words. LaMP answers from the shop's own figures."),
        ("chat_answer", 3, "Ask LaMP", "It can suggest steps, but it never approves, pays or contacts anyone."),
        ("approvals", 0, "Approvals", "Nothing happens until the owner says yes."),
        ("approved", 0, "Approvals", "Each approval shows what it saved."),
        ("customers", 0, "Customers", "BDT 38,000 owed by six families, listed by number, never by name. Each has a link to their own card."),
    ],
    "phone": [
        ("customer_home", 0, "Customer's card", "Families buy medicine on credit too. With the code from the pharmacy, a customer opens their own card."),
        ("customer_card", 0, "Customer's card", "They see what they owe and pick weekly payments that fit."),
        ("customer_saved", 0, "Customer's card", "Cards show amounts only, never names or medicines."),
    ],
}
FIRST = {"owner": "today", "phone": "customer_home"}
WITH_PHOTO = {"camera", "shot", "scan_read"}  # the bill's photo shows large beside these


def font(kind, size):
    return ImageFont.truetype(FONT[kind], size)


def run(args):
    subprocess.run(args, cwd=WORK, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def length(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         cwd=WORK, check=True, capture_output=True, text=True).stdout
    return float(out)


def wrap(d, text, f, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if d.textlength(trial, font=f) <= width or not line:
            line = trial
        else:
            lines.append(line); line = word
    return lines + [line]


def background():
    """Green with the wordmark, and the phone's body with a soft shadow and side buttons."""
    from PIL import ImageFilter
    im = Image.new("RGB", (W, H), GREEN)
    d = ImageDraw.Draw(im)
    f = font("black", 64); x = TEXT_X
    for t, c in (("La", "white"), ("M", SIGNAL), ("P", "white")):
        d.text((x, 70), t, font=f, fill=c); x += d.textlength(t, font=f)
    shadow = Image.new("L", (W, H), 0)
    x0, y0, x1, y1 = BODY
    ImageDraw.Draw(shadow).rounded_rectangle((x0 + 6, y0 + 14, x1 + 6, y1 + 14), radius=RADIUS + BEZ, fill=120)
    im.paste((5, 30, 22), (0, 0), shadow.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(im)
    metal = (58, 60, 64)
    for top, length in ((150, 46), (230, 84), (330, 84)):        # action button, volume up and down
        d.rounded_rectangle((x0 - 5, y0 + top, x0 + 4, y0 + top + length), radius=3, fill=metal)
    d.rounded_rectangle((x1 - 4, y0 + 260, x1 + 5, y0 + 380), radius=3, fill=metal)  # side button
    d.rounded_rectangle(BODY, radius=RADIUS + BEZ, fill=metal)                       # metal rim
    d.rounded_rectangle((x0 + 3, y0 + 3, x1 - 3, y1 - 3), radius=RADIUS + BEZ - 3, fill=(8, 8, 8))
    path = os.path.join(WORK, "bg.png"); im.save(path)
    return os.path.basename(path)


def chrome():
    """Everything drawn over the screen: rounded corners, the camera cut-out, the status bar's
    time, signal, Wi-Fi and battery, and the home bar. Drawn at 3x and scaled down for smooth edges."""
    k = 3
    im = Image.new("RGBA", (W * k, H * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    X, Y, Wd, Hd = SX * k, SY * k, SW * k, SH * k
    # corners: outside the rounded screen but inside its square box, the background shows again
    mask = Image.new("L", (W * k, H * k), 0)
    md = ImageDraw.Draw(mask)
    md.rectangle((X - 4 * k, Y - 4 * k, X + Wd + 4 * k, Y + Hd + 4 * k), fill=255)
    md.rounded_rectangle((X, Y, X + Wd, Y + Hd), radius=RADIUS * k, fill=0)
    sc = SW / 393 * k                                  # points to pixels
    mid = Y + 11 * sc + 37 * sc / 2                    # middle of the status bar's content
    # camera cut-out
    iw, ih = 125 * sc, 37 * sc
    d.rounded_rectangle((X + Wd / 2 - iw / 2, Y + 11 * sc, X + Wd / 2 + iw / 2, Y + 11 * sc + ih), radius=ih / 2, fill=(0, 0, 0, 255))
    d.ellipse((X + Wd / 2 + iw / 2 - 26 * sc, mid - 6 * sc, X + Wd / 2 + iw / 2 - 14 * sc, mid + 6 * sc), fill=(22, 26, 40, 255))
    # time, centred in the space left of the cut-out
    tf = ImageFont.truetype(FONT["semi"], round(17 * sc))
    left_mid = X + (Wd / 2 - iw / 2) / 2 + 6 * sc
    d.text((left_mid, mid), "9:41", font=tf, fill=INK + (255,), anchor="mm")
    # right side: signal bars, Wi-Fi, battery
    right_mid = X + Wd - (Wd / 2 - iw / 2) / 2 - 4 * sc
    gx = right_mid - 40 * sc                           # left edge of the group (about 80 points wide)
    for i in range(4):                                 # signal
        bh = (4 + i * 2.6) * sc
        d.rounded_rectangle((gx + i * 4.6 * sc, mid + 5 * sc - bh, gx + i * 4.6 * sc + 3 * sc, mid + 5 * sc), radius=0.9 * sc, fill=INK + (255,))
    wx, wy = gx + 32 * sc, mid + 5.5 * sc              # Wi-Fi: three arcs and a dot, fanning up from (wx, wy)
    for r in (12.5, 8.4, 4.3):
        rr = r * sc
        d.arc((wx - rr, wy - rr, wx + rr, wy + rr), start=225, end=315, fill=INK + (255,), width=round(2.4 * sc))
    d.ellipse((wx - 1.6 * sc, wy - 2.4 * sc, wx + 1.6 * sc, wy + 0.8 * sc), fill=INK + (255,))
    bx = gx + 50 * sc                                  # battery
    d.rounded_rectangle((bx, mid - 6 * sc, bx + 25 * sc, mid + 6 * sc), radius=3.6 * sc, outline=INK + (110,), width=round(1.1 * sc))
    d.rounded_rectangle((bx + 2 * sc, mid - 4 * sc, bx + 19.5 * sc, mid + 4 * sc), radius=2.2 * sc, fill=INK + (255,))
    d.rounded_rectangle((bx + 26.2 * sc, mid - 2.2 * sc, bx + 27.8 * sc, mid + 2.2 * sc), radius=0.8 * sc, fill=INK + (110,))
    # home bar
    hw = 134 * sc
    d.rounded_rectangle((X + Wd / 2 - hw / 2, Y + Hd - 13 * sc, X + Wd / 2 + hw / 2, Y + Hd - 8 * sc), radius=2.5 * sc, fill=INK + (230,))
    im = im.resize((W, H), Image.LANCZOS)
    bg = Image.open(os.path.join(WORK, background())).convert("RGBA")
    bg.putalpha(mask.resize((W, H), Image.LANCZOS))
    im = Image.alpha_composite(im, bg)
    path = os.path.join(WORK, "chrome.png"); im.save(path)
    return os.path.basename(path)


PHOTO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "camera_invoice.png")


def photo():
    """The camera's picture of the bill, cropped to its printed part, as a print with a white edge and a shadow.
    On the phone it is too small to read, so it is shown large beside it."""
    from PIL import ImageFilter
    pic = Image.open(PHOTO).convert("RGB").crop((150, 320, 932, 900))   # the bill's printed top half
    pic = pic.resize((660, round(660 * pic.height / pic.width)), Image.LANCZOS)
    edge = 14
    card = Image.new("RGBA", (pic.width + 2 * edge + 40, pic.height + 2 * edge + 40), (0, 0, 0, 0))
    shadow = Image.new("L", card.size, 0)
    ImageDraw.Draw(shadow).rounded_rectangle((24, 28, card.width - 12, card.height - 8), radius=18, fill=140)
    card.paste((3, 25, 17, 255), (0, 0), shadow.filter(ImageFilter.GaussianBlur(12)))
    ImageDraw.Draw(card).rounded_rectangle((16, 16, 16 + pic.width + 2 * edge, 16 + pic.height + 2 * edge), radius=16, fill="white")
    card.paste(pic, (16 + edge, 16 + edge))
    return card


def caption(name, title, text, pic=False):
    """A transparent frame with the page name and the caption on the left, and the bill's photo under it if asked."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    tf, cf = font("black", 76), font("semi", 50)
    lines = wrap(d, text, cf, TEXT_W)
    card = photo() if pic else None
    y = (H - (110 + len(lines) * 68 + (card.height + 20 if card else 0))) // 2 + 30
    d.text((TEXT_X, y), title, font=tf, fill=SIGNAL)
    y += 110
    for line in lines:
        d.text((TEXT_X, y), line, font=cf, fill="white"); y += 68
    if card:
        im.alpha_composite(card, (TEXT_X - 16, y + 20))
    path = os.path.join(WORK, f"{name}.png"); im.save(path)
    return os.path.basename(path)


def segment(take, tail=0.0):
    """Trim a take from its first scene to its end mark, put it on the phone and caption it."""
    at = {m["scene"]: m["t"] for m in json.load(open(os.path.join(REC, f"scenes_{take}.json")))}
    start, end = at[FIRST[take]], at["end"]
    total = end - start + tail
    cues = [(at[s] + off - start, title, text, s in WITH_PHOTO) for s, off, title, text in CAPTIONS[take]]
    inputs = ["-loop", "1", "-framerate", str(FPS), "-i", background(),
              "-ss", f"{start}", "-to", f"{end}", "-i", os.path.join(REC, f"{take}.mp4"),
              "-loop", "1", "-framerate", str(FPS), "-i", chrome()]
    # The status bar takes the colour of the app's top edge, frame by frame, like a real phone.
    graph = [f"[1:v]fps={FPS},tpad=stop_mode=clone:stop_duration={tail},split[a][b]",
             f"[a]scale={SW}:{VH}:flags=lanczos[app]",
             f"[b]crop=iw:4:0:0,scale={SW}:{SB}[bar]",
             f"[0:v][bar]overlay={SX}:{SY}[s0]", f"[s0][app]overlay={SX}:{SY + SB}[s1]",
             "[s1][2:v]overlay=0:0[c0]"]
    last = "c0"
    for i, (t0, title, text, pic) in enumerate(cues):
        t1 = cues[i + 1][0] if i + 1 < len(cues) else total + 1
        inputs += ["-loop", "1", "-framerate", str(FPS), "-i", caption(f"{take}_{i}", title, text, pic)]
        graph.append(f"[{last}][{i + 3}:v]overlay=0:0:enable='between(t,{t0:.3f},{t1 - 0.001:.3f})'[c{i + 1}]")
        last = f"c{i + 1}"
    out = f"seg_{take}.mp4"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(graph) + f";[{last}]format=yuv420p[v]",
         "-map", "[v]", "-t", f"{total:.3f}", "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-preset", "medium",
         "-an", out])
    return out


a, b = segment("owner"), segment("phone", TAIL)
run(["ffmpeg", "-y", "-i", a, "-i", b, "-filter_complex",
     f"[0:v][1:v]xfade=transition=fade:duration={FADE}:offset={length(os.path.join(WORK, a)) - FADE:.3f}[v]",
     "-map", "[v]", "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
     "-movflags", "+faststart", OUT])
print(f"{OUT}: {length(OUT):.1f} s")
