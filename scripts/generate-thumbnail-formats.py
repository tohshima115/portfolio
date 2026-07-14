#!/usr/bin/env python3
"""
ブログサムネイルPNGから、AVIF(第一候補)とWebP(フォールバック)を生成し、
`public/blog/` に配置する。

Sharpがこのプロジェクトの構成(@astrojs/cloudflareのワーカーバンドル)と
相性が悪くastro:assetsの<Image>/<Picture>が使えないため、事前にPillowで
静的なAVIF/WebP/PNGの3点セットを作り、<picture>で手動配信する方式にした。

Usage:
    python scripts/generate-thumbnail-formats.py <slug1> [<slug2> ...]
    python scripts/generate-thumbnail-formats.py --all
"""
import sys
from pathlib import Path

from PIL import Image

SRC_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "blog"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "blog"


def convert(slug: str) -> None:
    src = SRC_DIR / f"{slug}.png"
    if not src.exists():
        print(f"skip (not found): {src}")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(src).convert("RGB")

    avif_path = OUT_DIR / f"{slug}.avif"
    webp_path = OUT_DIR / f"{slug}.webp"
    png_path = OUT_DIR / f"{slug}.png"

    img.save(avif_path, "AVIF", quality=60)
    img.save(webp_path, "WEBP", quality=80)
    img.save(png_path, "PNG", optimize=True)

    sizes = {p.name: p.stat().st_size for p in (avif_path, webp_path, png_path)}
    print(f"{slug}: " + ", ".join(f"{k}={v // 1024}KB" for k, v in sizes.items()))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python scripts/generate-thumbnail-formats.py <slug...> | --all")
        sys.exit(1)

    if sys.argv[1] == "--all":
        slugs = [p.stem for p in sorted(SRC_DIR.glob("*.png"))]
    else:
        slugs = sys.argv[1:]

    for slug in slugs:
        convert(slug)
