"""Make the fake phone-camera feed for the demo (python video/assets/make_camera_feed.py).

The printed Supplier K bill (invoice_supplier_k.pdf) lying on a shop counter, seen from above with
a little tilt and soft light, as one still frame: camera_invoice.png and camera_invoice.mjpeg
(Chrome's fake camera plays the .mjpeg). Every frame is the same picture, so a photo taken from
it is the same each run and its reading can be recorded once in eval/replay. Needs PyMuPDF,
Pillow, numpy and ffmpeg."""
import os
import subprocess

import fitz
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920  # the size the browser hands the app; the phone screen then shows x 96..984 of it

# The bill, rendered sharp enough to read.
page = fitz.open(os.path.join(HERE, "invoice_supplier_k.pdf"))[0]
pix = page.get_pixmap(dpi=200)
bill = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

# A counter top: warm wood-like grain from smoothed noise.
rng = np.random.default_rng(7)
grain = rng.normal(0, 1, (H // 4, W // 64)).astype(np.float32)
grain = np.array(Image.fromarray(grain).resize((W, H), Image.BICUBIC))
streaks = np.sin(np.linspace(0, 40, W))[None, :] * 0.35
tone = (grain * 0.5 + streaks)[..., None]
base = np.array([132, 98, 68], np.float32)
desk = np.clip(base + tone * 14 + rng.normal(0, 3, (H, W, 1)), 0, 255).astype(np.uint8)
desk = Image.fromarray(np.repeat(desk, 3, axis=2) if desk.shape[2] == 1 else desk)
desk = Image.fromarray((np.array(desk, np.float32) * np.array([1.0, 0.78, 0.55])).clip(0, 255).astype(np.uint8))


def warp(img: Image.Image, quad):
    """Map img onto the four corners quad (tl, tr, br, bl) of a WxH frame."""
    w, h = img.size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    # Solve for the transform that sends output points back to source points.
    a = []
    for (x, y), (u, v) in zip(quad, src):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    b = np.array(src, np.float64).reshape(8)
    coeffs = np.linalg.solve(np.array(a, np.float64), b)
    return img.transform((W, H), Image.PERSPECTIVE, tuple(coeffs), Image.BICUBIC, fillcolor=None)


# The whole bill inside the app's guide frame, a little tilted, as if the phone is held over it.
quad = [(196, 372), (884, 352), (906, 1340), (176, 1362)]
rgba = bill.convert("RGBA")
paper = warp(rgba, quad)

# A soft shadow under the paper.
shadow = Image.new("L", (W, H), 0)
ImageDraw.Draw(shadow).polygon([(x + 14, y + 18) for x, y in quad], fill=150)
shadow = shadow.filter(ImageFilter.GaussianBlur(22))
frame = desk.convert("RGB")
frame.paste(Image.new("RGB", (W, H), (25, 15, 8)), (0, 0), shadow)
frame.paste(paper, (0, 0), paper)

# Light from the top left, a touch of lens vignette and sensor noise.
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
light = 1.06 - 0.12 * ((xx / W) * 0.6 + (yy / H) * 0.4)
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
vignette = 1 - 0.18 * np.clip(r - 0.55, 0, None) ** 1.5
arr = np.array(frame, np.float32) * (light * vignette)[..., None]
arr += rng.normal(0, 2.2, arr.shape)
frame = Image.fromarray(arr.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))

png = os.path.join(HERE, "camera_invoice.png")
frame.save(png)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", png, "-t", "2", "-r", "30",
                "-pix_fmt", "yuvj420p", "-q:v", "2", "-f", "mjpeg",  # the fake camera reads 4:2:0 only
                os.path.join(HERE, "camera_invoice.mjpeg")], check=True)
print("wrote", png)
