"""Копирует сборку в site/ и отправляет на GitHub Pages.

    python tools/publish.py [коммит-сообщение]

`site/` — рабочая копия репозитория (там же .git, source/ и README.md сайта).
Скрипт обновляет только игровые файлы, служебные каталоги не трогает.
"""

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
SITE = ROOT / "site"
KEEP = {"source", "README.md", ".git", ".nojekyll"}


def sync():
    for entry in BUILD.iterdir():
        if entry.name in KEEP:
            continue
        target = SITE / entry.name
        if entry.is_dir():
            if target.exists():
                shutil.rmtree(target)
            shutil.copytree(entry, target)
        else:
            shutil.copy2(entry, target)
    # файлы, которых больше нет в сборке
    for entry in SITE.iterdir():
        if entry.name in KEEP or (BUILD / entry.name).exists():
            continue
        if entry.is_dir():
            shutil.rmtree(entry)
        else:
            entry.unlink()


def git(*args):
    return subprocess.run(["git", "-C", str(SITE), *args], check=True,
                          capture_output=True, text=True).stdout.strip()


def main():
    message = sys.argv[1] if len(sys.argv) > 1 else "Обновление сборки"
    sync()
    git("add", "-A")
    if not git("status", "--porcelain"):
        print("изменений нет")
        return
    git("commit", "-m", message)
    git("push", "origin", "HEAD:main")
    print(git("log", "--oneline", "-1"))
    print("сайт: https://artikgor2014-star.github.io/pressing-under-pressure-ru/")


if __name__ == "__main__":
    main()
