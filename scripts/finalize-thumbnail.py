#!/usr/bin/env python3
"""
images_upscale(mode=ultra-denoiser)でノイズ除去した画像を、
元のサムネイル解像度に戻して src/assets/blog/<slug>.png に上書きする。
そのあと generate-thumbnail-formats.py 相当の処理(AVIF/WebP/PNG生成)まで行う。

Usage:
    python scripts/finalize-thumbnail.py <slug> <denoised_image_path>
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src" / "assets" / "blog"
OUT_DIR = ROOT / "public" / "blog"

TARGET_SIZE = (2688, 1520)  # 既存サムネイルと揃える (16:9 @2k相当)


def finalize(slug: str, denoised_path: Path) -> None:
    img = Image.open(denoised_path).convert("RGB")
    img = img.resize(TARGET_SIZE, Image.LANCZOS)

    src_png = SRC_DIR / f"{slug}.png"
    img.save(src_png, "PNG", optimize=True)
    print(f"saved: {src_png} {img.size}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    avif_path = OUT_DIR / f"{slug}.avif"
    webp_path = OUT_DIR / f"{slug}.webp"
    png_path = OUT_DIR / f"{slug}.png"

    img.save(avif_path, "AVIF", quality=60)
    img.save(webp_path, "WEBP", quality=80)
    img.save(png_path, "PNG", optimize=True)

    sizes = {p.name: p.stat().st_size for p in (avif_path, webp_path, png_path)}
    print(f"{slug}: " + ", ".join(f"{k}={v // 1024}KB" for k, v in sizes.items()))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: python scripts/finalize-thumbnail.py <slug> <denoised_image_path>")
        sys.exit(1)
    finalize(sys.argv[1], Path(sys.argv[2]))
