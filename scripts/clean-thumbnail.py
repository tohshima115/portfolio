#!/usr/bin/env python3
"""
生成AIサムネイル画像から、透かし由来などの微細なノイズを除去する後処理。
本来フラットな塗り分けのはずの領域を、色を少数のクラスタに量子化して
パキッとした単色に寄せることでノイズを潰す。ビルドパイプラインには含めない
（`node scripts/`ではなくPythonで手元実行するだけの開発用ツール）。

Usage:
    python scripts/clean-thumbnail.py <input.png> <output.png> [colors]
"""
import sys

from PIL import Image, ImageFilter


def clean(src: str, dst: str, colors: int = 24, despeckle_radius: int = 1) -> None:
    img = Image.open(src).convert("RGB")

    if despeckle_radius > 0:
        img = img.filter(ImageFilter.MedianFilter(size=despeckle_radius * 2 + 1))

    # dither=NONE が必須。ditherを掛けるとノイズっぽい模様が逆に増える。
    quantized = img.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE)
    quantized.convert("RGB").save(dst)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: python scripts/clean-thumbnail.py <input.png> <output.png> [colors]")
        sys.exit(1)

    n_colors = int(sys.argv[3]) if len(sys.argv) > 3 else 24
    clean(sys.argv[1], sys.argv[2], colors=n_colors)
    print(f"saved: {sys.argv[2]} (colors={n_colors})")
