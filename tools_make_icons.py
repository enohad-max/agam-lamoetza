"""Generates PWA icons (run once: python tools_make_icons.py)."""
import math
from PIL import Image, ImageDraw


def make(size, path):
    s = size * 4  # supersample for smooth edges
    img = Image.new("RGB", (s, s))
    px = img.load()
    for y in range(s):
        for x in range(s):
            t = (x + y) / (2 * s)
            px[x, y] = (int(124 + (236 - 124) * t), int(58 + (72 - 58) * t), int(237 + (153 - 237) * t))
    d = ImageDraw.Draw(img)
    cx, cy, R, r = s / 2, s / 2, s * 0.30, s * 0.13
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=(253, 224, 71))
    img.resize((size, size), Image.LANCZOS).save(path)


make(192, "icons/icon-192.png")
make(512, "icons/icon-512.png")
make(180, "icons/apple-touch-icon.png")
