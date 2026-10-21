"""Generates PWA icons with Agam's photo (run once: python tools_make_icons.py)."""
from PIL import Image, ImageDraw, ImageFilter

PHOTO = Image.open("img/agam-cutout.png").convert("RGBA")
BASE = 1024  # draw big, then downscale for crisp edges


def gradient(s):
    img = Image.new("RGB", (s, s))
    px = img.load()
    for y in range(s):
        for x in range(s):
            t = (x + y) / (2 * s)
            px[x, y] = (int(109 + (236 - 109) * t), int(40 + (72 - 40) * t), int(217 + (153 - 217) * t))
    return img.convert("RGBA")


def compose():
    s = BASE
    img = gradient(s)

    # זוהר רך + "שמש" צהובה מאחורי אגם
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy, R = s * 0.5, s * 0.52, s * 0.37
    gd.ellipse((cx - R * 1.25, cy - R * 1.25, cx + R * 1.25, cy + R * 1.25), fill=(255, 255, 255, 70))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(s * 0.03)))
    d = ImageDraw.Draw(img)
    d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=(253, 224, 71, 255))
    d.ellipse((cx - R, cy - R, cx + R, cy + R), outline=(255, 255, 255, 255), width=int(s * 0.014))

    # אגם: גדולה, צמודה לתחתית, יוצאת מעט מהעיגול (עומק)
    h = int(s * 0.80)
    w = int(PHOTO.width * h / PHOTO.height)
    person = PHOTO.resize((w, h), Image.LANCZOS)
    px, py = (s - w) // 2, s - h
    shadow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    shadow.paste((46, 16, 101, 110), (px, py + int(s * 0.012)), person.split()[3])
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(s * 0.012)))
    img.alpha_composite(person, (px, py))

    # תג הצבעה: עיגול ירוק עם וי
    bx, by, br = s * 0.80, s * 0.78, s * 0.115
    d = ImageDraw.Draw(img)
    d.ellipse((bx - br - 8, by - br - 8, bx + br + 8, by + br + 8), fill=(255, 255, 255, 255))
    d.ellipse((bx - br, by - br, bx + br, by + br), fill=(22, 163, 74, 255))
    d.line([(bx - br * .45, by + br * .02), (bx - br * .1, by + br * .38), (bx + br * .5, by - br * .35)],
           fill=(255, 255, 255, 255), width=int(br * .30), joint="curve")
    return img.convert("RGB")


big = compose()
for size, path in [(192, "icons/icon-192.png"), (512, "icons/icon-512.png"), (180, "icons/apple-touch-icon.png")]:
    big.resize((size, size), Image.LANCZOS).save(path)
