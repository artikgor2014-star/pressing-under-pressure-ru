"""Рисует иконку сайта: смешная картошка под давлением кнопки.

    python tools/make_icon.py <папка build>

Картошка приплюснута зелёной кнопкой, таращится вверх и потеет — отсылка
к «Pressing Under Pressure». Один и тот же набор фигур идёт и в растр, и в SVG.
Кладёт images/favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png,
icon-512.png.
"""

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

GRID = 512
SS = 2                       # суперсэмплинг: рисуем вдвое крупнее и уменьшаем

TILE_RADIUS = 104
TILE_BG = (10, 40, 24)

POTATO_C = (256, 326)
POTATO_RX = 178
POTATO_RY = 142
POTATO = (214, 162, 106)
POTATO_HI = (232, 190, 138)
POTATO_SPOT = (166, 118, 70)

PLATE = (104, 92, 408, 190)      # x0, y0, x1, y1 — зелёная кнопка сверху
PLATE_R = 24
PLATE_EDGE = 14                  # толщина нижней грани
GREEN = (30, 176, 84)
GREEN_DARK = (12, 106, 48)

INK = (42, 27, 16)
WHITE = (255, 255, 255)
SWEAT = (126, 206, 244)

EYES = [(198, 318, 44), (318, 308, 33)]   # cx, cy, r — разного размера, для смеха
PUPIL_R = 15
PUPIL_LIFT = 10
BROWS = [(158, 246, 216, 232), (296, 232, 354, 246)]

MOUTH = (196, 372, 378, 30)      # x0, x1, y, полувысота открытого рта
TONGUE = (256, 386, 30, 20)      # cx, cy, rx, ry
SPECKLES = [(146, 262, 12, 8), (356, 288, 10, 7), (318, 416, 9, 6), (188, 428, 7, 5)]
SWEATS = [(392, 268, 14), (120, 274, 11)]


def _blob_points(step=3.0):
    """Картофелина: эллипс с мягкими неровностями по краю."""
    pts = []
    a = 0.0
    while a < 360.0:
        t = math.radians(a)
        r = (1 + 0.055 * math.sin(3 * t + 0.7)
             + 0.035 * math.cos(5 * t + 2.1)
             + 0.02 * math.sin(7 * t + 4.0))
        pts.append((POTATO_C[0] + POTATO_RX * math.cos(t) * r,
                    POTATO_C[1] + POTATO_RY * math.sin(t) * r))
        a += step
    return pts


def _s(points, k):
    return [(x * k, y * k) for x, y in points]


def _wave(y, x0, x1, amp, humps=3, n=48):
    """Волнистая линия для гримасы."""
    out = []
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t
        out.append((x, y + amp * math.sin(t * math.pi * 2 * humps)))
    return out


def _drop(cx, cy, size):
    """Капля пота: круг снизу и острие сверху."""
    r = size
    return [
        (cx, cy - size * 2.1),
        (cx + r * 0.55, cy - size * 0.9),
        (cx + r, cy),
        (cx + r * 0.55, cy + r * 0.8),
        (cx, cy + r),
        (cx - r * 0.55, cy + r * 0.8),
        (cx - r, cy),
        (cx - r * 0.55, cy - size * 0.9),
    ]


def draw(size=1024):
    k = size / GRID
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # фон
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=TILE_RADIUS * k, fill=TILE_BG + (255,))

    # картошка и её блик
    d.polygon(_s(_blob_points(), k), fill=POTATO + (255,))

    hi = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(hi).ellipse([x * k for x in (118, 210, 214, 268)], fill=POTATO_HI + (120,))
    img.alpha_composite(hi.filter(ImageFilter.GaussianBlur(12 * k)))

    # румянец на щеках
    blush = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blush)
    for cx, cy in ((160, 356), (352, 350)):
        bd.ellipse([(cx - 34) * k, (cy - 20) * k, (cx + 34) * k, (cy + 20) * k],
                   fill=(226, 120, 96, 90))
    img.alpha_composite(blush.filter(ImageFilter.GaussianBlur(7 * k)))

    for cx, cy, rx, ry in SPECKLES:
        d.ellipse([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k, (cy + ry) * k],
                  fill=POTATO_SPOT + (255,))

    # тень от кнопки на картошке
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [PLATE[0] * k, (PLATE[3] - 6) * k, PLATE[2] * k, (PLATE[3] + 26) * k],
        radius=PLATE_R * k, fill=(60, 34, 12, 90))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(10 * k)))

    # кнопка, которая давит сверху
    x0, y0, x1, y1 = PLATE
    d.rounded_rectangle([x0 * k, (y0 + PLATE_EDGE) * k, x1 * k, y1 * k],
                        radius=PLATE_R * k, fill=GREEN_DARK + (255,))
    d.rounded_rectangle([x0 * k, y0 * k, x1 * k, (y1 - PLATE_EDGE) * k],
                        radius=PLATE_R * k, fill=GREEN + (255,))

    # линии скорости над кнопкой
    for cx, y0, y1 in ((188, 22, 64), (256, 14, 58), (324, 22, 64)):
        d.rounded_rectangle([(cx - 10) * k, y0 * k, (cx + 10) * k, y1 * k],
                            radius=10 * k, fill=GREEN + (255,))

    # глаза — разные, чтобы картошка выглядела придурковато
    for cx, cy, r in EYES:
        d.ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k], fill=WHITE + (255,))
        d.ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k],
                  outline=INK + (255,), width=int(5 * k))
    for cx, cy, r in EYES:
        px, py = cx + 4, cy - PUPIL_LIFT
        d.ellipse([(px - PUPIL_R) * k, (py - PUPIL_R) * k,
                   (px + PUPIL_R) * k, (py + PUPIL_R) * k], fill=INK + (255,))
        d.ellipse([(px - PUPIL_R + 4) * k, (py - PUPIL_R + 3) * k,
                   (px - PUPIL_R + 11) * k, (py - PUPIL_R + 10) * k], fill=WHITE + (255,))

    # поднятые брови — удивление от давления
    for x0, y0, x1, y1 in BROWS:
        d.line(_s([(x0, y0), (x1, y1)], k), fill=INK + (255,),
               width=int(9 * k))

    # открытый рот с языком
    mx0, mx1, my, mh = MOUTH
    d.ellipse([mx0 * k, (my - mh) * k, mx1 * k, (my + mh) * k], fill=INK + (255,))
    tx, ty, trx, try_ = TONGUE
    d.ellipse([(tx - trx) * k, (ty - try_) * k, (tx + trx) * k, (ty + try_) * k],
              fill=(226, 96, 112, 255))

    # пот
    for cx, cy, size_ in SWEATS:
        d.polygon(_s(_drop(cx, cy, size_), k), fill=SWEAT + (255,))
    return img


def _fmt(points):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


def _path(points, close=False):
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in points)
    return d + (" Z" if close else "")


def svg():
    x0, y0, x1, y1 = PLATE
    mouth = _wave(MOUTH[2], MOUTH[0], MOUTH[1], MOUTH[3])
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">',
        f'  <rect width="512" height="512" rx="{TILE_RADIUS}" fill="rgb{TILE_BG}"/>',
        f'  <path d="{_path(_blob_points(), True)}" fill="rgb{POTATO}"/>',
        '  <ellipse cx="166" cy="252" rx="50" ry="32" fill="rgb' + str(POTATO_HI) + '" opacity="0.55"/>',
        '  <ellipse cx="160" cy="356" rx="34" ry="20" fill="rgb(226,120,96)" opacity="0.35"/>',
        '  <ellipse cx="352" cy="350" rx="34" ry="20" fill="rgb(226,120,96)" opacity="0.35"/>',
    ]
    for cx, cy, rx, ry in SPECKLES:
        parts.append(f'  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="rgb{POTATO_SPOT}"/>')

    parts.append('  <defs><filter id="soft" x="-20%" y="-60%" width="140%" height="220%">'
                 '<feGaussianBlur stdDeviation="7"/></filter></defs>')
    parts.append(f'  <rect x="{x0}" y="{y1 - 2}" width="{x1 - x0}" height="24" rx="{PLATE_R}" '
                 f'fill="rgb(60,34,12)" opacity="0.42" filter="url(#soft)"/>')
    parts.append(f'  <rect x="{x0}" y="{y0 + PLATE_EDGE}" width="{x1 - x0}" height="{y1 - y0 - PLATE_EDGE}" '
                 f'rx="{PLATE_R}" fill="rgb{GREEN_DARK}"/>')
    parts.append(f'  <rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0 - PLATE_EDGE}" '
                 f'rx="{PLATE_R}" fill="rgb{GREEN}"/>')
    for cx, y0, y1 in ((188, 22, 64), (256, 14, 58), (324, 22, 64)):
        parts.append(f'  <rect x="{cx - 10}" y="{y0}" width="20" height="{y1 - y0}" rx="10" fill="rgb{GREEN}"/>')

    for cx, cy, r in EYES:
        parts.append(f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="#ffffff" stroke="rgb{INK}" stroke-width="5"/>')
    for cx, cy, r in EYES:
        px, py = cx + 4, cy - PUPIL_LIFT
        parts.append(f'  <circle cx="{px}" cy="{py}" r="{PUPIL_R}" fill="rgb{INK}"/>')
        parts.append(f'  <circle cx="{px - PUPIL_R + 8}" cy="{py - PUPIL_R + 6}" r="4" fill="#ffffff"/>')

    for x0, y0, x1, y1 in BROWS:
        parts.append(f'  <line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y1}" '
                     f'stroke="rgb{INK}" stroke-width="9" stroke-linecap="round"/>')

    mx0, mx1, my, mh = MOUTH
    parts.append(f'  <ellipse cx="{(mx0 + mx1) / 2}" cy="{my}" rx="{(mx1 - mx0) / 2}" ry="{mh}" fill="rgb{INK}"/>')
    tx, ty, trx, try_ = TONGUE
    parts.append(f'  <ellipse cx="{tx}" cy="{ty}" rx="{trx}" ry="{try_}" fill="rgb(226,96,112)"/>')

    for cx, cy, size_ in SWEATS:
        parts.append(f'  <path d="{_path(_drop(cx, cy, size_), True)}" fill="rgb{SWEAT}"/>')

    parts.append('</svg>')
    return "\n".join(parts) + "\n"


def draw_small(size):
    """Упрощённая версия для 16–32 px: крупные глаза и рот, без мелочей."""
    k = size / GRID
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=TILE_RADIUS * k, fill=TILE_BG + (255,))
    d.ellipse([120 * k, 168 * k, 392 * k, 470 * k], fill=POTATO + (255,))

    x0, y0, x1, y1 = (84, 84, 428, 208)
    d.rounded_rectangle([x0 * k, (y0 + 20) * k, x1 * k, y1 * k], radius=32 * k, fill=GREEN_DARK + (255,))
    d.rounded_rectangle([x0 * k, y0 * k, x1 * k, (y1 - 20) * k], radius=32 * k, fill=GREEN + (255,))

    for cx, cy, r in ((190, 306, 60), (330, 306, 52)):
        d.ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k], fill=WHITE + (255,))
        pr = int(r * 0.44)
        d.ellipse([(cx - pr) * k, (cy - pr - 6) * k, (cx + pr) * k, (cy + pr - 6) * k], fill=INK + (255,))

    d.ellipse([184 * k, 372 * k, 384 * k, 448 * k], fill=INK + (255,))
    return img


def build(out_dir):
    out = Path(out_dir) / "images"
    out.mkdir(parents=True, exist_ok=True)

    master = draw(GRID * SS).resize((512, 512), Image.LANCZOS)
    master.save(out / "icon-512.png")
    master.resize((180, 180), Image.LANCZOS).save(out / "apple-touch-icon.png")
    (out / "favicon.svg").write_text(svg(), encoding="utf-8")

    sizes = [(16, 16), (32, 32), (48, 48)]
    frames = []
    for w, h in sizes:
        base = draw_small(GRID) if w <= 32 else draw(GRID * SS)
        frames.append(base.resize((w, h), Image.LANCZOS))
    frames[-1].save(out / "favicon.ico", format="ICO", sizes=sizes, append_images=frames[:-1])
    return out


if __name__ == "__main__":
    print(build(sys.argv[1] if len(sys.argv) > 1 else "build"))
