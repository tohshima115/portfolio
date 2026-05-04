---
title: System Guide
description: ポートフォリオサイトのデザインシステムガイド (v4.0.0)。
order: 4
---

# System Guide v4.0.0

## 00. Philosophy — Functionality Over Decoration

このポートフォリオは、私がデザインエンジニアとして大切にしている「機能美」の実験場です。

装飾のための装飾を排し、情報の階層構造とインタラクションの意味を明確にすることで、ユーザーにとって直感的かつ心地よい体験を提供することを目的としています。

## 01. Typography

### Font Family

- Sans: **Roboto Flex** / **Noto Sans JP**
- Mono: **JetBrains Mono** / monospace

### Scale

- **Display (H1)**: text-5xl 〜 text-7xl, font-black, tracking-tighter
- **Heading (H2)**: text-3xl 〜 text-5xl, font-bold, tracking-tight
- **Body**: text-base 〜 text-lg, leading-relaxed

## 02. Color Palette

| Role | Hex | OKLCH |
|---|---|---|
| Background | `#0a0a0a` | `oklch(0.145 0 0)` |
| Surface | `#171717` | — |
| Accent / Primary | `#FACC15` | — |
| Text | `#FFFFFF` | — |

## 03. Components

### Primary Button
黄色背景 (`bg-yellow-400`) + 黒文字 + uppercase tracking-widest。

### Secondary Button
透明背景 + ニュートラルな枠線 + 白文字。
