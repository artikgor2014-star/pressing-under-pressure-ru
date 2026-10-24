"""Перерисовывает заголовок в images/sprites.png (плитка 10: 1024,1024).

Оригинальная плитка — белая маска: надпись PRESSING на прозрачном фоне и щит,
в котором вырезаны полупрозрачные слова UNDER / PRESSURE. Скрипт стирает
английский текст и вписывает русский тем же приёмом: «ЖМИ» — белым поверх
фона, «ПОД ДАВЛЕНИЕМ» — вырезом в щите. Стрелка, паз и «подтёки» на верхней
кромке остаются оригинальными.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from scipy import ndimage

TILE = (1024, 1024)
ERASE_BAND = (0, 74, 511, 168)   # где была надпись PRESSING (с её свечением)
SHIELD_BOX = (0, 168, 512, 470)  # где лежит сам щит
WORDS_BAND = (214, 318)          # UNDER / PRESSURE вместе с тенями
NOTCH_X0, NOTCH_X1, NOTCH_TOP = 178, 335, 418   # паз внизу щита

LINE1 = {"text": "ПОД", "center": (257, 243), "width": 400, "height": 34}
LINE2 = {"text": "ДАВЛЕНИЕМ", "center": (257, 289), "width": 420, "height": 34}
TOP = {"text": "ЖМИ", "center": (256, 132), "width": 353, "height": 52}

WEIGHT = 800                     # подобран по IoU с оригинальной надписью
CUT_ALPHA = 0.9                  # плотность вырезанных букв (оригинал ≈ 0.89)


def _font(path, weight, size):
    font = TTFont(path)
    if "fvar" in font:
        instantiateVariableFont(font, {"wght": weight}, inplace=True)
        path = f"{path}.{weight}.tmp.ttf"
        font.save(path)
    return ImageFont.truetype(path, size)


def _render(text, font):
    """Рисует текст и возвращает обрезанную маску."""
    canvas = Image.new("L", (font.size * len(text) * 2 + 200, font.size * 3), 0)
    ImageDraw.Draw(canvas).text((100, font.size), text, font=font, fill=255)
    box = canvas.getbbox()
    if box is None:
        raise ValueError(f"пустая маска для {text!r}")
    return canvas.crop(box)


def _fit(spec, path):
    """Подбирает кегль так, чтобы маска попала в высоту и ширину оригинала."""
    text, height, width = spec["text"], spec["height"], spec["width"]
    size = max(8, int(height * 1.8))

    for _ in range(30):
        mask = _render(text, _font(path, WEIGHT, size))
        ratio = min(height / mask.height, width / mask.width)
        if abs(ratio - 1) < 0.02:
            break
        size = max(8, int(round(size * ratio)))

    return _render(text, _font(path, WEIGHT, size))


def _glow(mask, strength=52.0, tau=6.0, radius=26):
    """Мягкое свечение вокруг букв, как у оригинальной надписи."""
    pad = radius + 2
    solid = np.pad(np.array(mask) > 128, pad, constant_values=False)
    dist = ndimage.distance_transform_edt(~solid)
    halo = strength * np.exp(-np.clip(dist - 1.5, 0, None) / tau)
    halo[solid] = 255
    halo[dist > radius] = 0
    return Image.fromarray(np.clip(halo, 0, 255).astype("uint8"))


def _blit(target, mask, center, mode, glow=False):
    if glow:
        mask = _glow(mask)
    x = int(round(center[0] - mask.width / 2))
    y = int(round(center[1] - mask.height / 2))
    box = (x, y, x + mask.width, y + mask.height)
    region = np.array(target.crop(box)).astype(np.int16)
    m = np.array(mask).astype(np.int16)
    if mode == "white":
        region = np.maximum(region, m)
    else:  # cut: буквы вырезаются из белого щита
        region = np.minimum(region, 255 - (m * CUT_ALPHA).astype(np.int16))
    target.paste(Image.fromarray(region.clip(0, 255).astype("uint8")), (x, y))


def _shield_body(alpha):
    """Силуэт щита по крайним пикселям строки, без паза внизу."""
    solid = np.array(alpha) > 140

    filled = np.zeros_like(solid)
    for y in range(SHIELD_BOX[1], SHIELD_BOX[3]):
        cols = np.where(solid[y])[0]
        if len(cols):
            filled[y, cols.min():cols.max() + 1] = True

    filled[: SHIELD_BOX[1]] = False
    filled[SHIELD_BOX[3]:] = False

    notch = np.zeros_like(filled)
    notch[NOTCH_TOP:, NOTCH_X0:NOTCH_X1 + 1] = True
    return filled & ~notch


def _clean_words(alpha):
    """Заливает английские слова и их тени, не трогая стрелку и паз."""
    a = np.array(alpha).astype(np.int16)
    band = np.zeros(a.shape, bool)
    band[WORDS_BAND[0]:WORDS_BAND[1], :] = True
    a[_shield_body(alpha) & band] = 255
    return Image.fromarray(a.clip(0, 255).astype("uint8"))


def build(sprites_path, font_path):
    image = Image.open(sprites_path).convert("RGBA")
    tile = image.crop((TILE[0], TILE[1], TILE[0] + 512, TILE[1] + 512))
    alpha = tile.getchannel("A")

    # 1. стереть английскую надпись над щитом вместе со свечением
    erase = Image.new("L", (512, 512), 0)
    ImageDraw.Draw(erase).rectangle(ERASE_BAND, fill=255)
    alpha = Image.composite(Image.new("L", (512, 512), 0), alpha, erase)

    # 2. залить английские слова и их тени; стрелка, паз и подтёки остаются
    alpha = _clean_words(alpha)

    # 3. вписать русский заголовок
    _blit(alpha, _fit(TOP, font_path), TOP["center"], "white", glow=True)
    _blit(alpha, _fit(LINE1, font_path), LINE1["center"], "cut")
    _blit(alpha, _fit(LINE2, font_path), LINE2["center"], "cut")

    tile.putalpha(alpha)
    image.paste(tile, (TILE[0], TILE[1]))
    image.save(sprites_path)
    return sprites_path


if __name__ == "__main__":
    import sys

    build(sys.argv[1], sys.argv[2])
