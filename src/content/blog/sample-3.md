---
title: "React と Astro の共存について"
description: "アイランドアーキテクチャを利用したパフォーマンス最適化戦略"
pubDate: "2026-02-23"
tags: ["React", "Astro", "Performance", "Engineering"]
---

Astro の最も特徴的な機能の一つがこれです。UI フレームワークを自由に選択し、必要な部分だけをハイドレーションさせます。

## パフォーマンス
通常 SSR/SSG では全 JavaScript がクライアントに送信されますが、Astro ではデフォルトで 0KB の JS となり、信じられないほどに高速な Web サイトを構築可能です。

React を使用したインタラクティブなコンポーネントのみを `client:load` や `client:visible` で指定できるのが魅力です。
