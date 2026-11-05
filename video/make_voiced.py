"""Cut the AIgnite demo film to a recorded voiceover (1080p, 60 fps, captions of the spoken words).

python video/make_voiced.py <rec_dir> <voice_clean.wav> <out.mp4> [live_url]
Each scene changes in the pause before its line. A scene longer than its line plays faster; a shorter
one holds its last frame. LINES holds where each line is spoken in the recording, found with
ffmpeg silencedetect; re-measure them if the voice is re-recorded."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

REC, VOICE, OUT = (os.path.abspath(a) for a in sys.argv[1:4])
LIVE_URL = sys.argv[4] if len(sys.argv) > 4 else "lamp-ai-web.onrender.com"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
STICKER = os.path.join(ROOT, "frontend", "public", "aignite-sticker.png")
WORK = os.path.join(REC, "cut_voiced"); os.makedirs(WORK, exist_ok=True)
W, H, FPS = 1920, 1080, 60
FADE = 0.5  # seconds of crossfade between scenes
TAIL = 1.5  # seconds the end card stays after the last word
GREEN, SIGNAL, MINT = (15, 77, 58), (255, 212, 0), (207, 232, 218)
FONT = {k: os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", f) for k, f in
        {"reg": "segoeui.ttf", "semi": "seguisb.ttf", "black": "seguibl.ttf"}.items()}

# (speech start, speech end, pauses inside the line, scene, caption chunks). Times are seconds in the voice file.
LINES = [
    (0.40, 5.41, [], ("card", "title"), []),
    (5.98, 10.11, [], ("owner", "pin", "today"),
     ["This is Green Life Pharmacy in Bogura. The owner unlocks LaMP with a PIN."]),
    (10.59, 20.62, [17.1], ("owner", "today", "capture"),
     ["Straight away, LaMP warns that the shop will be 19,000 taka short on 26 October,",
      "the day Supplier A's 60,000 taka order is due."]),
    (21.11, 33.68, [23.96, 26.57], ("owner", "capture", "funding"),
     ["Most of a pharmacy's numbers live on paper.",
      "The owner snaps a supplier invoice,",
      "and AI reads every line: products, batches, expiry dates and prices.",
      "Nothing is saved until the owner checks it."]),
    (35.14, 41.63, [], ("owner", "funding", "funding_cost"),
     ["LaMP plans with the cheapest money first:",
      "order fewer of the slow seller, then ask the supplier for more days."]),
    (42.57, 50.57, [46.2], ("owner", "funding_cost", "chat"),
     ["Borrowing it all would cost 421 taka.",
      "This plan costs nothing, or 182 taka if the supplier says no."]),
    (53.71, 67.19, [58.84], ("owner", "chat", "approve"),
     ["The owner can just ask: \"Can I pay Supplier A's order next week?\"",
      "LaMP answers from the shop's own figures and suggests the steps.",
      "It can suggest, but it can never approve, pay or contact anyone."]),
    (68.92, 81.00, [74.70, 79.10], ("owner", "approve", "end"),
     ["Every step waits for the owner, and loans need the PIN again.",
      "Each approval shows what it saved: over 11,000 taka so far,",
      "mostly by not buying stock that would expire on the shelf."]),
    (82.44, 95.70, [92.24], ("phone", "customer_home", "end"),
     ["Families buy medicine on credit too.",
      "With the code on their slip, a customer opens their own card. No app, no PIN.",
      "They see what they owe and pick a plan that fits their week.",
      "The card shows amounts only, never names or medicines."]),
    (97.20, 105.53, [], ("owner_end", "owner_customers", "end"),
     ["Back at the counter, the owner sees the plan right away.",
      "Every step, by the owner, LaMP or a customer, is saved in a history no one can secretly change."]),
    (106.43, 114.79, [], ("card", "end"), []),
]


def font(kind, size):
    return ImageFont.truetype(FONT[kind], size)


def run(args):
    subprocess.run(args, cwd=WORK, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def ts(sec):
    h, rem = divmod(max(sec, 0), 3600); m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def chunk_times(start, end, pauses, chunks):
    """Split a line's speaking time between its caption chunks by length, snapping to a pause when one is near."""
    total = sum(len(c) for c in chunks)
    times, at = [start], start
    for c in chunks[:-1]:
        at += (end - start) * len(c) / total
        near = min(pauses, key=lambda p: abs(p - at), default=None)
        times.append(near if near is not None and abs(near - at) < 1.5 else at)
    return times


def ass(name, cues, length, style):
    """One subtitle file per scene: white text on a dark box."""
    lines = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "",
             "[V4+ Styles]",
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
             "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
             "Style: Cap,Segoe UI Semibold,46,&H00FFFFFF,&H00FFFFFF,&H28101010,&H28101010,0,0,0,0,100,100,0,0,3,16,0,2,160,160,56,1",
             # Beside the phone: left of it, under the label, so the screen stays clear.
             "Style: Side,Segoe UI Semibold,42,&H00FFFFFF,&H00FFFFFF,&H28101010,&H28101010,0,0,0,0,100,100,0,0,3,16,0,1,160,840,250,1",
             "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for i, (start, text) in enumerate(cues):
        end = cues[i + 1][0] if i + 1 < len(cues) else length
        lines.append(f"Dialogue: 0,{ts(start)},{ts(end - 0.05)},{style},,0,0,0,,{text}")
    path = os.path.join(WORK, f"{name}.ass")
    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    return os.path.basename(path)


def fit(src_len, length):
    """Video filter that makes src_len seconds last `length`: faster if too long, hold the last frame if too short."""
    if src_len > length:
        return f"setpts=PTS*{length / src_len:.5f}"
    return f"setpts=PTS,tpad=stop_mode=clone:stop_duration={length - src_len + 0.1:.3f}"


PHONE = {"body": (1150, 36, 1150 + 480, 36 + 1008), "screen": (452, 980, 1164, 50)}


def phone_layers():
    """Background with the label, and a phone frame whose screen is a transparent hole."""
    bg = Image.new("RGB", (W, H), GREEN)
    d = ImageDraw.Draw(bg)
    d.text((160, 300), "On the customer's phone", font=font("semi", 64), fill="white")
    d.text((160, 392), "No PIN and no app to install:", font=font("reg", 40), fill=MINT)
    d.text((160, 446), "just the code from the pharmacy.", font=font("reg", 40), fill=MINT)
    bg.save(os.path.join(WORK, "phone_bg.png"))
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle(PHONE["body"], radius=64, fill=(12, 12, 12, 255))
    sw, sh, sx, sy = PHONE["screen"]
    hole = Image.new("L", (W, H), 0)
    ImageDraw.Draw(hole).rounded_rectangle((sx, sy, sx + sw, sy + sh), radius=46, fill=255)
    frame.putalpha(Image.composite(Image.new("L", (W, H), 0), frame.getchannel("A"), hole))
    frame.save(os.path.join(WORK, "phone_frame.png"))
    return "phone_bg.png", "phone_frame.png"


def scene(i, take, first, last, length, cues):
    """Trim a take between two scene marks, fit it to `length` seconds, caption it, encode at 1080p60."""
    at = {m["scene"]: m["t"] for m in json.load(open(os.path.join(REC, f"scenes_{take}.json")))}
    start, end = at[first], at[last]
    subs = ass(f"s{i:02d}", cues, length, "Side" if take == "phone" else "Cap")
    src = os.path.join(REC, f"{take}.mp4")
    out = f"s{i:02d}.mp4"
    if take == "phone":
        bg, frame = phone_layers()
        scr_w, scr_h, scr_x, scr_y = PHONE["screen"]
        graph = (f"[1:v]{fit(end - start, length)},fps={FPS},scale={scr_w}:{scr_h}:flags=lanczos[ph];"
                 f"[0:v][ph]overlay={scr_x}:{scr_y}[a];[a][2:v]overlay=0:0,subtitles={subs},format=yuv420p")
        run(["ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", bg, "-ss", f"{start}", "-to", f"{end}", "-i", src,
             "-loop", "1", "-framerate", str(FPS), "-i", frame, "-filter_complex", graph, "-t", f"{length:.3f}",
             "-r", str(FPS), "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-an", out])
    else:
        run(["ffmpeg", "-y", "-ss", f"{start}", "-to", f"{end}", "-i", src,
             "-vf", f"{fit(end - start, length)},fps={FPS},scale={W}:{H}:flags=lanczos,subtitles={subs},format=yuv420p",
             "-t", f"{length:.3f}", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-an", out])
    return out


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
    out = f"card_{name}.mp4"
    run(["ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", os.path.basename(png), "-t", f"{seconds:.3f}",
         "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-tune", "stillimage", "-an", out])
    return out


CARDS = {
    "title": [
        ("black", 150, "white", [("La", "white"), ("M", SIGNAL), ("P", "white")]),
        ("semi", 52, "white", "Cash, stock and supplier bills for neighborhood pharmacies,"),
        ("semi", 52, "white", "and the families who buy there on credit."),
        ("reg", 34, MINT, "Bangladesh · A K M Ishmam Tahmid"),
    ],
    "end": [
        ("black", 96, "white", "Try it live"),
        ("semi", 60, SIGNAL, LIVE_URL),
        ("reg", 40, "white", "Owner PIN 2468  ·  Customer card GL-7KQM-4XPA"),
        ("reg", 34, MINT, "LaMP reads and suggests. People approve. It never moves money."),
    ],
}

# Scene k runs from cut[k] to cut[k + 1]; each cut sits in the pause before a line, with the fade centred on it.
cuts = [0.0] + [(LINES[k - 1][1] + LINES[k][0]) / 2 - FADE / 2 for k in range(1, len(LINES))]
total = LINES[-1][1] + TAIL
cuts.append(total)
parts = []
for k, (start, end, pauses, what, chunks) in enumerate(LINES):
    length = cuts[k + 1] - cuts[k] + (FADE if k < len(LINES) - 1 else 0)  # overlap the next scene's fade
    cues = [(t - cuts[k], c) for t, c in zip(chunk_times(start, end, pauses, chunks), chunks)] if chunks else []
    if cues:
        cues[0] = (max(cues[0][0], FADE), cues[0][1])
    parts.append(card(what[1], CARDS[what[1]], length) if what[0] == "card" else scene(k, *what, length, cues))
    print(f"{k:2d} {what[1]:<15} {cuts[k]:6.2f}s +{length:5.2f}s")

inputs, graph, last = [], [], "0:v"
for i, clip in enumerate(parts):
    inputs += ["-i", clip]
    if i:
        graph.append(f"[{last}][{i}:v]xfade=transition=fade:duration={FADE}:offset={cuts[i]:.3f}[v{i}]")
        last = f"v{i}"
n = len(parts)
graph.append(f"[{n}:a]apad,atrim=0:{total:.3f},afade=t=out:st={total - 0.8:.3f}:d=0.8[a]")
run(["ffmpeg", "-y", *inputs, "-i", VOICE, "-filter_complex", ";".join(graph), "-map", f"[{last}]", "-map", "[a]",
     "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", OUT])
print("wrote", OUT)
