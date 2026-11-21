"""Join the feature-demo takes into one silent, upright phone film (python video/make_features.py <takes_dir> <out.mp4>).

No title card and no end card: owner.mp4, then the customer's card (phone.mp4), then
owner_more.mp4, meeting with a short crossfade. Every take is a phone screen recorded at
780x1688; the film is 1080 px wide at 60 fps. Needs ffmpeg."""
import os
import subprocess
import sys

TAKES, OUT = sys.argv[1], sys.argv[2]
FADE = 0.4  # seconds
W, H = 1080, 2338  # 780x1688 scaled up, kept even


def length(path: str) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


parts = [os.path.join(TAKES, f"{n}.mp4") for n in ("owner", "phone", "owner_more")]
inputs = sum((["-i", p] for p in parts), [])
fit = f"scale={W}:{H}:flags=lanczos,fps=60,settb=AVTB,format=yuv420p"
graph = [f"[{i}:v]{fit}[v{i}]" for i in range(3)]
t1 = length(parts[0]) - FADE
t2 = t1 + length(parts[1]) - FADE
graph.append(f"[v0][v1]xfade=transition=fade:duration={FADE}:offset={t1:.3f}[ab]")
graph.append(f"[ab][v2]xfade=transition=fade:duration={FADE}:offset={t2:.3f}[v]")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(graph),
                "-map", "[v]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", OUT],
               check=True)
print(f"{OUT}: {length(OUT):.1f} s")
