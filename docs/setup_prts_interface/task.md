# PRTS UI 実装タスク

## 概要
ユーザーからのリクエストに基づき、アークナイツのPRTS端末のような3D風UIを実装する。
CSSの `perspective` と `transform` を活用し、軽量かつSEOに有利な実装とする。

## 手順
1. **環境設定**:
    - [ ] `pnpm` を使用してNode.js v22を有効化する（Astro 5対応のため）。
    - [ ] React統合をプロジェクトに追加する（`@astrojs/react`）。

2. **コンポーネント実装**:
    - [ ] `src/components/PrtsInterface.tsx` を作成し、提供されたコードを移植する。
    - [ ] Tailwind CSSのクラスが正しく適用されることを確認する。

3. **ページへの組み込み**:
    - [ ] `src/pages/index.astro` に `PrtsInterface` コンポーネントを配置する。
    - [ ] `client:load` または `client:visible` ディレクティブを使用してインタラクティブにする。

4. **確認**:
    - [ ] ブラウザで動作確認（マウス追従、3D効果）。
