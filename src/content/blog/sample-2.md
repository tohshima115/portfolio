---
title: "Astro の Content Collections を試す"
description: "Astro v2 から導入された Content Collections の機能についての検証メモです。"
pubDate: "2026-02-22"
---

# Content Collections の導入

Astro の Content Collections は、マークダウンのフロントマターを Zod でスキーマ検証できるため非常に便利です。

## メリット
1. **型の安全性:** `zod` により TypeScript の型が恩恵を受けられます。
2. **自動推論:** `getCollection` を叩いた時に補完が効きます。
3. **記述の一貫性:** ブログやプロジェクトのメタ情報をバリデーションして一貫性を保てます。

エラーハンドリングもしやすくなるので、個人開発でもチーム開発でも重宝しそうです。
