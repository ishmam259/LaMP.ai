"""Cut the AIgnite demo film (1080p, 60 fps) from record_aignite.py's takes, with English captions burned in.

python video/make_aignite.py <rec_dir> <out.mp4> [live_url]
Needs ffmpeg on PATH and Pillow. Captions are timed against the scene marks in scenes_<take>.json,
so re-recording keeps them in step with the screen. Sections meet with a short crossfade."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

REC, OUT = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
LIVE_URL = sys.argv[3] if len(sys.argv) > 3 else "lamp-ai-web.onrender.com"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
STICKER = os.path.join(ROOT, "frontend", "public", "aignite-sticker.png")
WORK = os.path.join(REC, "cut"); os.makedirs(WORK, exist_ok=True)
W, H, FPS = 1920, 1080, 60
FADE = 0.5  # seconds of crossfade between sections
GREEN, SIGNAL, MINT = (15, 77, 58), (255, 212, 0), (207, 232, 218)
FONT = {k: os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", f) for k, f in
        {"reg": "segoeui.ttf", "semi": "seguisb.ttf", "black": "seguibl.ttf"}.items()}

# (scene to start at, seconds into that scene, caption) per take; each runs until the next one.
CAPTIONS = {
    "owner": [
        ("pin", 0, "Green Life Pharmacy, Bogura. The owner unlocks LaMP with a PIN."),
        ("today", 0, "LaMP sees the shop will be BDT 19,000 short on 26 Oct, when Supplier A's order is due."),
        ("capture", 0, "Snap a supplier invoice. AI reads every line: products, batches, expiry dates, prices."),
        ("capture", 7, "The owner checks each field before anything is saved."),
        ("funding", 0, "Cheapest money first: order fewer slow sellers, then ask the supplier for more days."),
        ("funding_cost", 0, "Borrowing it all would cost BDT 421.64. This plan costs BDT 0, or BDT 181.97 if the supplier says no."),
        ("chat", 0, "Ask LaMP in plain words. It answers from the shop's own figures."),
        ("chat", 11, "It can suggest steps, but it can't approve, pay or contact anyone."),
        ("approve", 0, "The owner approves each step. Loans need the PIN again."),
        ("approve", 8.5, "Each approval shows what it saved: BDT 11,039.67 so far."),
    ],
    "phone": [
        ("customer_home", 0, "Families buy medicine on credit too. With a code from the pharmacy, a customer opens their own card."),
        ("customer_card", 0, "They see what they owe and pick a plan that fits their week."),
        ("customer_saved", 0, "The card shows amounts only, never names or medicines."),
    ],
    "owner_end": [
        ("owner_customers", 0, "The owner sees the plan straight away on the Customers page."),
        ("owner_log", 0, "Every step, by the owner, LaMP or a customer, is saved in a history no one can secretly change."),
    ],
}
FIRST = {"owner": "pin", "phone": "customer_home", "owner_end": "owner_customers"}


def font(kind, size):
    return ImageFont.truetype(FONT[kind], size)


def run(args):
    subprocess.run(args, cwd=WORK, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def ts(sec):
    h, rem = divmod(max(sec, 0), 3600); m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def ass(name, cues, length, style="Cap"):
    """One subtitle file per segment: white text on a dark box, bottom centre."""
    lines = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "",
             "[V4+ Styles]",
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
             "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
             "Style: Cap,Segoe UI Semibold,46,&H00FFFFFF,&H00FFFFFF,&H28101010,&H28101010,0,0,0,0,100,100,0,0,3,16,0,2,160,160,56,1",
             # Beside the phone: left of it, under the label, so the screen stays clear.
             "Style: Side,Segoe UI Semibold,44,&H00FFFFFF,&H00FFFFFF,&H28101010,&H28101010,0,0,0,0,100,100,0,0,3,16,0,1,160,840,290,1",
             "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for i, (start, text) in enumerate(cues):
        end = cues[i + 1][0] if i + 1 < len(cues) else length
        lines.append(f"Dialogue: 0,{ts(start)},{ts(end - 0.05)},{style},,0,0,0,,{text}")
    path = os.path.join(WORK, f"{name}.ass")
    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    return os.path.basename(path)


def segment(take):
    """Trim a take from its first scene to its end mark, caption it, encode at 1080p60."""
    marks = json.load(open(os.path.join(REC, f"scenes_{take}.json")))
    at = {m["scene"]: m["t"] for m in marks}
    start, end = at[FIRST[take]], at["end"]
    cues = [(at[scene] + offset - start, text) for scene, offset, text in CAPTIONS[take]]
    subs = ass(take, cues, end - start, "Side" if take == "phone" else "Cap")
    src = os.path.join(REC, f"{take}.mp4")
    out = f"seg_{take}.mp4"
    if take == "phone":
        bg, frame = phone_layers()
        scr_w, scr_h, scr_x, scr_y = PHONE["screen"]
        graph = (f"[1:v]fps={FPS},scale={scr_w}:{scr_h}:flags=lanczos[ph];[0:v][ph]overlay={scr_x}:{scr_y}[a];"
                 f"[a][2:v]overlay=0:0,subtitles={subs},format=yuv420p")
        run(["ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", bg, "-ss", f"{start}", "-to", f"{end}", "-i", src,
             "-loop", "1", "-framerate", str(FPS), "-i", frame, "-filter_complex", graph, "-t", f"{end - start}",
             "-r", str(FPS), "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-an", out])
    else:
        run(["ffmpeg", "-y", "-ss", f"{start}", "-to", f"{end}", "-i", src,
             "-vf", f"fps={FPS},scale={W}:{H}:flags=lanczos,subtitles={subs},format=yuv420p",
             "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-an", out])
    return out


PHONE = {"body": (1150, 36, 1150 + 480, 36 + 1008), "screen": (452, 980, 1164, 50)}


def phone_layers():
    """Background with the label, and a phone frame whose screen is a transparent hole."""
    bg = Image.new("RGB", (W, H), GREEN)
    d = ImageDraw.Draw(bg)
    d.text((160, 400), "On the customer's phone", font=font("semi", 64), fill="white")
    d.text((160, 492), "No PIN and no app to install:", font=font("reg", 40), fill=MINT)
    d.text((160, 546), "just the code from the pharmacy.", font=font("reg", 40), fill=MINT)
    bg.save(os.path.join(WORK, "phone_bg.png"))
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle(PHONE["body"], radius=64, fill=(12, 12, 12, 255))
    sw, sh, sx, sy = PHONE["screen"]
    hole = Image.new("L", (W, H), 0)
    ImageDraw.Draw(hole).rounded_rectangle((sx, sy, sx + sw, sy + sh), radius=46, fill=255)
    alpha = frame.getchannel("A").point(lambda v: v)
    frame.putalpha(Image.composite(Image.new("L", (W, H), 0), alpha, hole))
    frame.save(os.path.join(WORK, "phone_frame.png"))
    return "phone_bg.png", "phone_frame.png"


def card(name, lines, seconds, sticker_h=150):
    """A still title or end card, encoded as a clip."""
    im = Image.new("RGB", (W, H), GREEN)
    st = Image.open(STICKER).convert("RGBA")
    st = st.resize((round(st.width * sticker_h / st.height), sticker_h), Image.LANCZOS)
    im.paste(st, ((W - st.width) // 2, 110), st)
    d = ImageDraw.Draw(im)
    y = 330
    for kind, size, colour, text in lines:
        f = font(kind, size)
        if isinstance(text, list):  # coloured runs on one line, e.g. the La-M-P wordmark
            total = sum(d.textlength(t, font=f) for t, _ in text); x = (W - total) / 2
            for t, c in text:
                d.text((x, y), t, font=f, fill=c); x += d.textlength(t, font=f)
        else:
            d.text(((W - d.textlength(text, font=f)) / 2, y), text, font=f, fill=colour)
        y += int(size * 1.35)
    png = os.path.join(WORK, f"{name}.png"); im.save(png)
    out = f"seg_{name}.mp4"
    run(["ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", os.path.basename(png), "-t", str(seconds),
         "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-tune", "stillimage", "-an", out])
    return out


parts = [
    card("title", [
        ("black", 150, "white", [("La", "white"), ("M", SIGNAL), ("P", "white")]),
        ("semi", 52, "white", "Cash, stock and supplier bills for neighborhood pharmacies,"),
        ("semi", 52, "white", "and the families who buy there on credit."),
        ("reg", 34, MINT, "Bangladesh · A K M Ishmam Tahmid"),
    ], 5),
    segment("owner"),
    segment("phone"),
    segment("owner_end"),
    card("end", [
        ("black", 96, "white", "Try it live"),
        ("semi", 60, SIGNAL, LIVE_URL),
        ("reg", 40, "white", "Owner PIN 2468  ·  Customer card GL-7KQM-4XPA"),
        ("reg", 34, MINT, "LaMP reads and suggests. People approve. It never moves money."),
    ], 7),
]


def length(clip):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clip],
                         cwd=WORK, check=True, capture_output=True, text=True).stdout
    return float(out)


# Crossfade each section into the next; offset is where the incoming one starts on the joined timeline.
inputs, graph, offset, last = [], [], 0.0, "0:v"
for i, clip in enumerate(parts):
    inputs += ["-i", clip]
    if i:
        offset += length(parts[i - 1]) - FADE
        graph.append(f"[{last}][{i}:v]xfade=transition=fade:duration={FADE}:offset={offset:.3f}[v{i}]")
        last = f"v{i}"
run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(graph), "-map", f"[{last}]", "-r", str(FPS),
     "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT])
print("wrote", OUT)
