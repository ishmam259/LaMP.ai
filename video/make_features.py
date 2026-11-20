"""Join the feature-demo takes into one silent film (python video/make_features.py <takes_dir> <out.mp4>).

No title card and no end card: owner.mp4, then the customer's phone (phone.mp4, centred on the
app's background colour), then owner_more.mp4, meeting with a short crossfade. 1920x1080 at
60 fps. Needs ffmpeg."""
import os
import subprocess
import sys

TAKES, OUT = sys.argv[1], sys.argv[2]
FADE = 0.4  # seconds
BG = "0xf5f8f6"  # --shelf, the app's light background


def length(path: str) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


parts = [os.path.join(TAKES, f"{n}.mp4") for n in ("owner", "phone", "owner_more")]
inputs = sum((["-i", p] for p in parts), [])
fit = "fps=60,settb=AVTB,format=yuv420p"
graph = [
    f"[0:v]scale=1920:1080,{fit}[a]",
    # the phone at full height, centred, with a soft edge so it reads as a phone screen
    f"[1:v]scale=-2:1000,{fit}[ph];color=c={BG}:s=1920x1080:r=60[bg];"
    f"[bg][ph]overlay=(W-w)/2:(H-h)/2:shortest=1,{fit}[b]",
    f"[2:v]scale=1920:1080,{fit}[c]",
]
t1 = length(parts[0]) - FADE
t2 = t1 + length(parts[1]) - FADE
graph.append(f"[a][b]xfade=transition=fade:duration={FADE}:offset={t1:.3f}[ab]")
graph.append(f"[ab][c]xfade=transition=fade:duration={FADE}:offset={t2:.3f}[v]")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(graph),
                "-map", "[v]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", OUT],
               check=True)
print(f"{OUT}: {length(OUT):.1f} s")
