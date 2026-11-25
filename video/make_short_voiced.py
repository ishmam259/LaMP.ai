"""Lay a voiceover onto the short demo and cut the film to it (1920x1080, 60 fps, AAC).

python video/make_short_voiced.py <takes_dir> <voice.m4a> <out.mp4>

1. The voice is cleaned: low rumble and hiss cut, breaths and room noise between lines pulled
   down, the level set to -16 LUFS for YouTube.
2. Each scene is stretched or squeezed to fit the line spoken over it, and moments inside a scene
   are pinned to the words that describe them (the shutter on "takes a photo of it", the answer
   on "LaMP answers", the card on "opens their card"). Speeds stay between about 0.75x and 2x.
3. Each section gets one caption, shown as its first line starts: the section's name, what it does
   and what it's for. They aren't subtitles; the voice tells the story.

The voice is never sped up or slowed down. If it is shorter than TARGET, equal pauses go in at the
section changes (BREAKS) to make up the difference.

BREAKS, ANCHORS and LINES hold times in the recording (seconds), measured from a word-timed transcript of
VOICEOVER_2MIN.md as read. A new recording needs them measured again. Needs ffmpeg and Pillow."""
import json, os, sys

import make_short as ms

REC, VOICE, OUT = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]), os.path.abspath(sys.argv[3])
ms.init(REC)
LEAD = 0.6     # seconds of picture before the first word
TAIL = 1.6     # seconds after the last word
CUE = 0.12     # a caption appears this long before its section
TARGET = 110.0  # length of the film; the voice keeps its speed, and the spare time becomes pauses

# Section changes, in the pauses between two lines of the recording. A pause is added at each one,
# all the same length, so the film comes out at TARGET; the new section appears halfway through it.
BREAKS = [9.0, 18.6, 31.3, 38.8, 51.5, 64.5, 77.95, 87.05]

# (take, scene mark, where it lands in the recording). Between two anchors the picture plays at
# one even speed, never slower than recorded: if it would have to slow down, it plays at normal
# speed and holds on its last frame.
ANCHORS = [
    ("owner", "today", 0.0),
    ("owner", "cash", 9.0),
    ("owner", "scan", 18.6),
    ("owner", "camera", 21.3),        # "The owner opens the Scan section"
    ("owner", "shot", 23.5),          # "...and takes a photo of it."
    ("owner", "scan_read", 24.76),    # "LaMP reads every line"
    ("owner", "stock", 31.3),
    ("owner", "plan", 38.8),
    ("owner", "plan_cost", 46.9),     # "Borrowing it all..."
    ("owner", "chat", 51.5),
    ("owner", "chat_answer", 57.34),  # "LaMP answers from the shop's own figures."
    ("owner", "approvals", 64.5),
    ("owner", "approved", 73.0),      # "Over 11,000 taka so far"
    ("owner", "customers", 77.95),
    ("owner", "end", 87.05),
    ("phone", "customer_home", 87.05),
    ("phone", "customer_card", 88.76),   # "...a customer opens their own card,"
    ("phone", "customer_saved", 94.9),   # "...picks four weekly payments."
    ("phone", "end", 98.9),
]
GAP = (TARGET - LEAD - TAIL - ANCHORS[-1][2]) / len(BREAKS)


def film(t):
    """Where a moment of the recording lands in the film, after the pauses are added."""
    return t + sum(GAP for b in BREAKS if b < t - 1e-6) + sum(GAP / 2 for b in BREAKS if abs(b - t) < 1e-6)

# One caption per section, saying what it does and what it's for (the voice tells the story).
# (start in the recording, section, caption, show the bill's photo)
LINES = [   # each starts at its section change
    (0.0, "Today", "The shop's day at a glance: cash now, the next money problem, and what to do about it.", False),
    (9.0, "Cash", "Every payment coming up, so the owner sees the day cash would run out before it happens.", False),
    (18.6, "Scan", "Take a photo of a paper bill. LaMP reads every line, and the owner checks it before it's saved.", True),
    (31.3, "Stock", "Medicine that expires soon, and how much of it can still go back to suppliers.", False),
    (38.8, "Plan", "The cheapest way to pay the next big bill: stuck cash and free extra days before any loan.", False),
    (51.5, "Ask LaMP", "Ask about the shop in plain words. LaMP answers from the shop's own figures and only suggests steps.", False),
    (64.5, "Approvals", "Every suggested step waits here. Nothing happens until the owner says yes.", False),
    (77.95, "Customers", "Families who buy on credit, by number, never by name, with what each owes and their plan.", False),
    (87.05, "Customer's card", "A family's own card: what they owe and a weekly plan they choose. Amounts only, no names or medicines.", False),
]

CLEAN = ("highpass=f=80,lowpass=f=12000,afftdn=nr=18:nf=-50:tn=1,"
         "agate=threshold=0.012:ratio=3:attack=5:release=180:range=0.08,"
         "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,"
         "loudnorm=I=-16:TP=-1.5:LRA=9")


def marks(take):
    return {m["scene"]: m["t"] for m in json.load(open(os.path.join(REC, f"scenes_{take}.json")))}


# 1. the cleaned voice, starting LEAD seconds in
voice = os.path.join(ms.WORK, "voice_clean.wav")
# Cut at each section change and put GAP seconds of silence in between; the speech itself is untouched.
cuts = [0.0, *BREAKS, None]
graph = []
for k, (a, b) in enumerate(zip(cuts, cuts[1:])):
    trim = f"atrim=start={a:.3f}" + (f":end={b:.3f}" if b is not None else "")
    graph.append(f"[0:a]{trim},asetpts=PTS-STARTPTS[v{k}]")
    if b is not None:
        graph.append(f"aevalsrc=0:d={GAP:.4f}:s=48000:c=mono[s{k}]")
order = "".join(f"[v{k}]" + (f"[s{k}]" if k < len(BREAKS) else "") for k in range(len(BREAKS) + 1))
graph.append(f"{order}concat=n={2 * len(BREAKS) + 1}:v=0:a=1,adelay={round(LEAD * 1000)}:all=1,afade=t=in:d=0.05[out]")
ms.run(["ffmpeg", "-y", "-i", VOICE, "-af", CLEAN + ",aresample=48000,aformat=channel_layouts=mono", "-ac", "1", "-ar", "48000",
        "voice_only.wav"])
ms.run(["ffmpeg", "-y", "-i", "voice_only.wav", "-filter_complex", ";".join(graph), "-map", "[out]", "-ac", "1",
        "-ar", "48000", voice])
total = film(ANCHORS[-1][2]) + LEAD + TAIL

# 2. the two takes on the phone, no captions; the owner's starts LEAD before Today
at = {"owner": marks("owner"), "phone": marks("phone")}
plain = {"owner": ms.segment("owner", lead=LEAD, captions=False, out="plain_owner.mp4"),
         "phone": ms.segment("phone", tail=TAIL + 2, captions=False, out="plain_phone.mp4")}
zero = {"owner": at["owner"]["today"] - LEAD, "phone": at["phone"]["customer_home"]}

pieces = []   # (file, from, to, seconds on screen)
first = ANCHORS[0]
pieces.append((plain["owner"], 0.0, LEAD, LEAD))   # the lead-in before the first word
for (ta, sa, va), (tb, sb, vb) in zip(ANCHORS, ANCHORS[1:]):
    if ta != tb:
        continue   # the cut from the owner's take to the phone
    a, b = at[ta][sa] - zero[ta], at[tb][sb] - zero[tb]
    pieces.append((plain[ta], a, b, film(vb) - film(va)))
end = at["phone"]["end"] - zero["phone"]
pieces.append((plain["phone"], end, end + TAIL, TAIL))   # hold the card after the last word

# Each piece is retimed into its own file, then they are joined: one filter graph with dozens of
# inputs of the same file stalls ffmpeg.
parts = []
for i, (f, a, b, d) in enumerate(pieces):
    stretch = min(1.0, d / (b - a))   # never slow motion: play at normal speed and hold the last frame
    hold_s = d - (b - a) * stretch
    print(f"{os.path.basename(f):16s} {a:7.2f}-{b:7.2f} -> {d:6.2f} s  x{1 / stretch:.2f}"
          + (f"  hold {hold_s:.2f} s" if hold_s > 0.02 else ""), flush=True)
    part = f"part_{i:02d}.mp4"
    ms.run(["ffmpeg", "-y", "-ss", f"{a:.3f}", "-t", f"{b - a + 0.5:.3f}", "-i", f, "-vf",
            f"trim=duration={b - a:.4f},setpts=(PTS-STARTPTS)*{stretch:.6f},fps={ms.FPS},"
            f"tpad=stop_mode=clone:stop_duration={hold_s + 1:.3f},trim=duration={d:.4f},setpts=PTS-STARTPTS",
            "-an", "-r", str(ms.FPS), "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", part])
    parts.append(part)
with open(os.path.join(ms.WORK, "parts.txt"), "w") as fh:
    fh.writelines(f"file '{p}'\n" for p in parts)
ms.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "parts.txt", "-c", "copy", "retimed.mp4"])

# 3. captions on the spoken words, and the voice
inputs, graph, last = ["-i", "retimed.mp4"], [], "0:v"
for k, (t, title, text, pic) in enumerate(LINES):
    t0 = max(0.0, film(t) + LEAD - CUE)
    t1 = film(LINES[k + 1][0]) + LEAD - CUE if k + 1 < len(LINES) else total + 1
    inputs += ["-loop", "1", "-framerate", str(ms.FPS), "-t", f"{total:.3f}", "-i", ms.caption(f"voiced_{k}", title, text, pic)]
    graph.append(f"[{last}][{k + 1}:v]overlay=0:0:enable='between(t,{t0:.3f},{t1 - 0.001:.3f})'[c{k + 1}]")
    last = f"c{k + 1}"
inputs += ["-i", voice]
graph.append(f"[{last}]format=yuv420p[v]")
graph.append(f"[{len(LINES) + 1}:a]apad,atrim=duration={total:.3f},afade=t=out:st={total - 0.8:.3f}:d=0.8[a]")
ms.run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(graph), "-map", "[v]", "-map", "[a]",
        "-t", f"{total:.3f}", "-r", str(ms.FPS), "-c:v", "libx264", "-crf", "18", "-preset", "medium",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT])
print(f"{OUT}: {ms.length(OUT):.1f} s")
