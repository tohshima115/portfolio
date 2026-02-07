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
| Hosting | Cloudflare Workers | Astro SSRアダプターを利用し、Edge上でアプリ全体を動作させる。 |
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

### Architecture
*   **Cloudflare D1 (SQLite)**: 「いいね」数やログの保存。
*   **Web Analytics**: Cloudflare Web Analyticsを利用したデータ可視化。

## 📂 ディレクトリ構造

```text
src/
├── components/       # UIコンポーネント
│   ├── common/       # サイト全体で使われる共通部分 (Header, Footer, Buttonなど)
│   └── pages/        # ページごとのコンポーネント (Home, Blog, Projectsなど)
├── content/          # 記事データ (Keystatic管理)
│   ├── blog/         # 開発ログ MDX
│   └── projects/     # 実績 MDX
├── data/             # 静的データ (TypeScript定数)
│   ├── common/       # 共通データ (navigation.tsなど)
│   └── pages/        # ページ固有データ (homeData.tsなど)
├── types/            # TypeScript型定義
│   ├── common.ts     # 共通の型
│   └── data.ts       # データの型定義
├── layouts/          # 共通レイアウト
├── pages/            # ルーティング
│   ├── index.astro
│   ├── blog/[...slug].astro
│   ├── og/[...slug].png.ts  # SatoriによるOGP生成
│   └── api/          # 内部API (Astro Endpoints)
├── assets/           # 画像アセット
└── utils/            # ヘルパー関数
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command | Action |
| :--- | :--- |
| `pnpm install` | Installs dependencies |
| `pnpm dev` | Starts local dev server at `localhost:4321` |
| `pnpm build` | Build your production site to `./dist/` |
| `pnpm preview` | Preview your build locally |
| `pnpm astro ...` | Run CLI commands like `astro add`, `astro check` |

## 📝 License

This project is open source.