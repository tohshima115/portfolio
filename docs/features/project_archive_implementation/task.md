# Task: 実績詳細ページ（The Archive）設計・実装

## 目的
MDXファイルを追加するだけで、すべての実績ページが単一の共通コンポーネントを通じて自動生成・マッピングされる、スケーラブルな詳細ページを構築する。
Keystaticを導入し、管理画面からコンテンツを入力できるようにする。
また、メンテナンス性を高めるために機能ごとのディレクトリ構造でコンポーネントを管理する。

## 要件
1. **レイアウトとレスポンシブ設計**
   - **PC (1024px+)**: 3カラム (左: Meta, 中央: Main, 右: Nav)
   - **Tablet (768px-1023px)**: 2カラム (左: Meta/Nav, 右: Main)
   - **Mobile (<767px)**: 1カラム (上: Header/Nav, 中: Visual/Meta, 下: Content/Accordion)

2. **MDXデータ構造と自動マッピング**
   - Content Collections (`src/content/projects/*.mdx`) を使用
   - フロントマターでメタデータを定義 (Keystatic schemaに準拠)
   - `src/pages/works/[...slug].astro` で動的生成

3. **Keystatic導入**
   - パッケージインストール (`@keystatic/astro`, `@keystatic/core`)
   - `keystatic.config.ts` の作成
   - Astro統合 (`astro.config.mjs`)
   - 管理画面 (`/keystatic`) の有効化

4. **コンポーネント実装 (リファクタリング済み)**
   - `src/layouts/ProjectLayout.astro`: Tailwind CSSの読み込みと基本HTML構造
   - `src/components/pages/works/ProjectDetail/`:
     - `MetaPanel/index.tsx`: 左カラムの属性表示パネル
     - `TableOfContents/index.tsx`: 右カラムの目次ナビゲーション
   - `src/components/pages/home/`:
     - `PrtsInterface/index.tsx`: トップページの3Dインターフェース

5. **ドキュメント更新**
   - `README.md` にKeystaticの使用方法を追記

## TODO
- [x] Keystaticパッケージのインストール
- [x] `keystatic.config.ts` の作成
- [x] `astro.config.mjs` の更新
- [x] `src/content/config.ts` の作成
- [x] コンポーネント作成とディレクトリ構造の整理
  - [x] `src/components/pages` ディレクトリの作成
  - [x] `ProjectMetaPanel` の移動とリファクタリング
  - [x] `TableOfContents` の新規作成
  - [x] `PrtsInterface` の移動
- [x] 動的ルートページ作成 (`src/pages/works/[...slug].astro`)
- [x] サンプルMDX作成 (`src/content/projects/swept.mdx`)
- [x] `README.md` 更新
