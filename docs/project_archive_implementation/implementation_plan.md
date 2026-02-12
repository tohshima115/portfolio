# Implementation Plan - Project Archive (The Archive)

MDXベースの実績詳細ページとKeystatic管理画面を実装します。

## Phase 1: Setup Keystatic & Content Collections
1.  **Install Dependencies**
    - `npm install @keystatic/astro @keystatic/core @astrojs/mdx` (もしMDXがまだなら)
    - `pnpm` を使用しているため `pnpm add` を使用。

2.  **Configure Keystatic**
    - `keystatic.config.ts` をルートに作成。
    - ユーザー提供のスキーマ定義を記述。
    - `astro.config.mjs` にKeystatic統合を追加。
    - `astro.config.mjs` にMDX統合がなければ追加。

3.  **Define Astro Content Collection Schema**
    - `src/content/config.ts` を作成。
    - `zod` を使用してフロントマターの型定義を行う (Keystaticと整合性を取る)。

## Phase 2: Create Components
1.  **Project Layout (`src/layouts/ProjectLayout.astro`)**
    - 基本的なHTML構造と共通ヘッダー/フッター (もしあれば)。
    - 今回は詳細ページ専用のレイアウトが必要そうなので、`ProjectArchiveLayout.astro` とする可能性があるが、ユーザー指定は `ProjectLayout` なのでそれに従う。

2.  **Meta Panel (`src/components/ProjectMetaPanel.tsx`)**
    - 左カラム用。
    - Props: `title`, `roles`, `duration`, `stack` 等。
    - ターミナル風デザイン。

3.  **Content Component**
    - MDXレンダリング部分。
    -中央カラム用。

4.  **Navigation (`src/components/ProjectNavigation.tsx` or inline in Astro)**
    - 右カラム用。
    - MDXの `headings` を受け取って目次を生成。

## Phase 3: Implement Dynamic Page
1.  **Page File (`src/pages/works/[...slug].astro`)**
    - `getStaticPaths` で `projects` コレクションを取得。
    - レスポンシブグリッド (Tailwind CSS) を実装。
    - PC: 3カラム, Tablet: 2カラム, Mobile: 1カラム (Accordion)。

## Phase 4: Documentation & Verification
1.  **Create Sample Content**
    - `src/content/projects/swept.mdx` を作成 (Keystatic経由または手動)。
    - 表示確認。

2.  **Update README**
    - Keystaticの起動方法 (`/keystatic`) を記載。

## User Verification Steps
- `/keystatic` にアクセスできるか。
- 管理画面からプロジェクトを追加できるか。
- `/works/swept` (例) にアクセスして、レスポンシブレイアウトが正しく機能しているか。
