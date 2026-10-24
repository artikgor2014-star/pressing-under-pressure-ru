"""Собирает русифицированную сборку из чистой копии игры.

    python tools/build.py

Результат: build/ (готовая папка), pup-ru.zip (архив для раздачи).
"""

import shutil
import sys
import zipfile
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
ORIGINAL = ROOT / "tools" / "original"
PATCH = ROOT / "patch"
BUILD = ROOT / "build"
FONT_VF = ROOT / "tools" / "assets" / "GolosText-VF.ttf"
FONT_TARGET = Path("fonts") / "Recursive-SemiBold.ttf"
ZIP = ROOT / "pup-ru.zip"

sys.path.insert(0, str(ROOT / "tools"))
import make_icon  # noqa: E402
import title_ru  # noqa: E402


def copy_tree():
    if BUILD.exists():
        shutil.rmtree(BUILD)
    shutil.copytree(ORIGINAL, BUILD)
    for path in PATCH.rglob("*"):
        if path.is_dir():
            continue
        target = BUILD / path.relative_to(PATCH)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)


def build_font():
    """Статический Golos Text вместо Recursive: в Recursive нет кириллицы."""
    font = TTFont(FONT_VF)
    instantiateVariableFont(font, {"wght": 600}, inplace=True)
    target = BUILD / FONT_TARGET
    font.save(target)
    return target


def build_title(font_path):
    title_ru.build(str(BUILD / "images" / "sprites.png"), str(font_path))


def build_zip():
    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(BUILD.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(BUILD).as_posix())


def main():
    copy_tree()
    font = build_font()
    build_title(font)
    make_icon.build(BUILD)
    stale = BUILD / "images" / "favicon.png"
    if stale.exists():
        stale.unlink()
    shutil.copy2(ROOT / "tools" / "play.bat", BUILD / "ИГРАТЬ.bat")
    build_zip()
    print(f"готово: {BUILD}")
    print(f"архив:  {ZIP} ({ZIP.stat().st_size / 1048576:.1f} МБ)")


if __name__ == "__main__":
    main()
