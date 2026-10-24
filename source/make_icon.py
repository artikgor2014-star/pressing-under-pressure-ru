"""Рисует иконку сайта: щит кнопки из игры с зелёной стрелкой вниз.

    python tools/make_icon.py <папка build>

Форма — щит: плоский верх со скруглёнными углами, плавные бока, закруглённое
острие. Пропорции сняты с маски спрайта (плитка 10).
Один и тот же контур идёт и в растр, и в SVG.
Кладёт images/favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png,
icon-512.png.
"""

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

GRID = 512
TOP = 126
BOTTOM = 452
HALF = 196
SHOULDER = 312           # где бока начинают сходиться
CORNER = 44

TILE_RADIUS = 104
TILE_BG = (10, 40, 24)

ARROW_SHAFT = (233, 188, 279, 284)
ARROW_HEAD = [(256, 372), (180, 280), (332, 280)]

WHITE = (255, 255, 255)
GREEN = (26, 172, 80)


def _cubic(p0, p1, p2, p3, n=18):
    out = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0]
        y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]
        out.append((x, y))
    return out


def _quad(p0, p1, p2, n=14):
    out = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        out.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))
    return out


def _arc(cx, cy, r, a0, a1, n=10):
    return [(cx + math.cos(a0 + (a1 - a0) * i / n) * r,
             cy + math.sin(a0 + (a1 - a0) * i / n) * r) for i in range(1, n + 1)]


def shield_points():
    """Контур по часовой стрелке: прямые бока и плавный сход в острие."""
    rt = CORNER
    top_r = TOP + rt
    shoulder = SHOULDER

    pts = [(256 - HALF + rt, TOP), (256 + HALF - rt, TOP)]
    pts += _arc(256 + HALF - rt, top_r, rt, -math.pi / 2, 0)

    # правый бок: вниз до плеча, затем плавный сход к острию
    pts.append((256 + HALF, shoulder))
    pts += _quad(
        (256 + HALF, shoulder),
        (256 + HALF - 14, BOTTOM - (BOTTOM - shoulder) * 0.34),
        (256, BOTTOM),
        26,
    )

    # левый бок обратно
    pts += _quad(
        (256, BOTTOM),
        (256 - HALF + 14, BOTTOM - (BOTTOM - shoulder) * 0.34),
        (256 - HALF, shoulder),
        26,
    )
    pts += _arc(256 - HALF + rt, top_r, rt, math.pi, math.pi * 1.5)
    return pts


def _poly(points, k):
    return [(x * k, y * k) for x, y in points]


def draw(size):
    k = size / GRID
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=TILE_RADIUS * k, fill=TILE_BG + (255,))
    d.polygon(_poly(shield_points(), k), fill=WHITE + (255,))

    x0, y0, x1, y1 = ARROW_SHAFT
    d.rectangle([x0 * k, y0 * k, x1 * k, y1 * k], fill=GREEN + (255,))
    d.polygon(_poly(ARROW_HEAD, k), fill=GREEN + (255,))
    return img


def _fmt(points):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


def _path(points):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in points) + " Z"


def svg():
    x0, y0, x1, y1 = ARROW_SHAFT
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="{TILE_RADIUS}" fill="rgb{TILE_BG}"/>
  <path d="{_path(shield_points())}" fill="#ffffff"/>
  <rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="rgb{GREEN}"/>
  <polygon points="{_fmt(ARROW_HEAD)}" fill="rgb{GREEN}"/>
</svg>
"""


def build(out_dir):
    out = Path(out_dir) / "images"
    out.mkdir(parents=True, exist_ok=True)

    master = draw(1024)
    master.save(out / "icon-512.png")
    master.resize((180, 180), Image.LANCZOS).save(out / "apple-touch-icon.png")
    (out / "favicon.svg").write_text(svg(), encoding="utf-8")

    sizes = [(16, 16), (32, 32), (48, 48)]
    frames = [master.resize(s, Image.LANCZOS) for s in sizes]
    frames[-1].save(out / "favicon.ico", format="ICO", sizes=sizes, append_images=frames[:-1])
    return out


if __name__ == "__main__":
    print(build(sys.argv[1] if len(sys.argv) > 1 else "build"))
