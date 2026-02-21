# Shogo Toyoshima Portfolio

**Design Engineer / UX Researcher ポートフォリオサイト**

このプロジェクトは、単なる作品集ではなく、「更新が続かない」「年1回作り直してしまう」という負のループからの脱却を目指した、持続可能なポートフォリオサイトのリニューアル計画です。

## 🏆 プロジェクトの目的

1.  **氏名検索での1位獲得（SEO）**: 技術的な正しさ（SSG/Semantic HTML）による検索順位の向上。
2.  **「生存報告」の自動化・省力化**: Obsidanなどのローカルツールと連携し、低コストでコンテンツを更新する仕組み。
3.  **技術的信頼性の証明**: Lighthouseスコア All 100、高速なページ遷移、Edgeでの動的生成など、モダンなWeb技術の実証。

## 🛠 技術スタック

「パフォーマンス（ユーザー体験）」と「開発者体験（更新の楽しさ）」の両立を最優先に選定しています。

| レイヤー | 選定技術 | 役割 |
| :--- | :--- | :--- |
| Framework | Astro | Island Architectureによる高速表示 & SSRモードでの動的機能提供。 |
| UI Library | React | コマンドパレットや「いいね」ボタンなどのリッチなインタラクションに使用。 |
| 3D / WebGL | R3F / Three.js | React Three Fiber (R3F) を使用した宣言的な3D表現の実装。 |
| Animation | Motion | ページ遷移やマイクロインタラクションの実装。 |
| Styling | Tailwind CSS | 効率的なスタイリングとモダンなUI構築。 |
| CMS | Keystatic | Git-based CMS。リポジトリ内のMarkdown/MDXを直接管理。 |
| Hosting | Cloudflare Pages | Astro 5 の静的・動的混合レンダリングを活用し、高速な配信を実現。 |
| Package Mgr | pnpm | 高速なパッケージ管理。 |

## ✨ 主な機能

### Core Features (基本機能)
*   **ポートフォリオ/実績一覧**: Keystaticで管理可能な実績紹介。
*   **開発ログ (Blog)**: Markdown/MDX形式のブログ。Link Post形式もサポート。
*   **動的OGP生成**: Satoriを使用し、Edge Function上でOGP画像をオンデマンド生成。

### Playful Features (インタラクション・動的機能)
*   **3D演出 (R3F)**: WebGLを用いたインタラクティブな表現。
*   **アニメーション (Motion)**: フェードイン/アウトやマイクロインタラクション。
*   **サーバーレス「いいね」ボタン**: Cloudflare D1を使用し、ログイン不要で連打可能な「いいね」機能を実装。
*   **コマンドパレット (Cmd+K)**: サイト内検索やページ移動を瞬時に行うインターフェース。
*   **最新コミットログ表示**: フッターにGitHub API経由で最新の更新を表示。
*   **システム更新通知 (System Updates)**: トップページにて、実績とブログの**最終更新日時 (`updatedDate`)** に基づいた最新の更新情報を独自UIで通知。

### Architecture
*   **Cloudflare D1 (SQLite)**: 「いいね」数やログの保存。
*   **Web Analytics**: Cloudflare Web Analyticsを利用したデータ可視化。
*   **Image Optimization**: Astro (`<Picture />`) で画像を最適化し、Reactコンポーネントには `children` として渡すComposition Patternを採用。
*   **Skeleton Loading**: ライブラリに依存せず、Tailwind CSS (`animate-pulse`) のみで実装し、画像のロード待機状態をCSSで制御してJS負荷を削減。

## � サイトマップ (Sitemap)

```text
root/
├── / (TOP)                 # [Dashboard] メインコンソール
│
├── /works (一覧)           # [Archives] 実績リスト
│   └── /[slug] (詳細)      # [File] 詳細ページ
│
├── /blog (一覧)            # [Logs] 開発ログ & 思考ログ
│   └── /[slug] (詳細)      # [Record] 記事ページ
│
├── /about                  # [Profile] プロフィール & 経歴
│   └── /uses               # [Equipment] 使用機材・ツール一覧
│
├── /contact                # [Comm] お問い合わせ
│                           # ★「遅延実行(Delayed Action)」UIの実装場所
│
├── /system                 # [Design System] UIガイドライン
│                           # ★「デザインエンジニア」としての設計思想を展示
│
├── /rss.xml                # [Signal] 自動生成される更新通知データ
│
└── /404                    # [Lost] 信号途絶画面 (グリッチ演出)
```

## 📂 ディレクトリ構造

```text
src/
├── components/       # UIコンポーネント (home, system, ...)
├── content/          # 記事データ (blog, projects)
├── layouts/          # 共通レイアウト (BaseLayout, ProjectLayout)
├── pages/            # ルーティング (index, works, blog, about, contact, system, rss.xml)
├── assets/           # 画像アセット
└── utils/            # ヘルパー関数
```

## 🚀 レンダリング・デプロイ設定 (Astro 5)

本プロジェクトは **Astro 5** の最新のレンダリング仕様を採用しています。

### 基本方針
- **デフォルトは静的生成 (SSG)**: `astro.config.mjs` で `output` を省略（デフォルトの `static`）に設定しています。これにより、ほとんどのページがビルド時に HTML として生成され、最高のパフォーマンスを発揮します。
- **オンデマンドレンダリング (SSR)**: 特定の動的機能が必要なページのみ、個別に SSR を選択します。
- **Cloudflare アダプター**: SSR や API ルートを実行するために `@astrojs/cloudflare` を導入しています。

### 実装ルール
- **静的ページ（推奨）**: 通常の `.astro` ファイル。ビルド時に静的化されます。
- **動的ページ (SSR)**: ファイルの冒頭に `export const prerender = false` を記述します。
- **CMS (Keystatic)**: Keystatic 関連のルート（`/keystatic` や `/api/keystatic`）は、統合設定により**自動的に SSR** として動作するように構成されています。

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command | Action |
| :--- | :--- |
| `pnpm install` | Installs dependencies |
| `pnpm dev` | Starts local dev server at `localhost:4321` |
| `pnpm build` | Build your production site to `./dist/` |
| `pnpm preview` | Preview your build locally |
| `pnpm astro ...` | Run CLI commands like `astro add`, `astro check` |

## 📝 コンテンツ管理 (CMS)

本プロジェクトは **Keystatic** を導入しており、ブラウザ上のGUIで記事や実績を管理できます。

### 管理画面へのアクセス
1.  開発サーバーを起動: `pnpm dev`
2.  `http://localhost:4321/keystatic` にアクセス

### 実績の追加手順
1.  Keystatic管理画面の「実績 (Projects)」を選択
2.  「Create」ボタンをクリック
3.  タイトル、期間、役割、技術スタックを入力し、本文を書く
4.  保存すると `src/content/projects/` に `.mdx` ファイルが自動生成されます

## 📝 License

This project is open source.