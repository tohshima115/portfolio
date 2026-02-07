# **ポートフォリオサイト リニューアル計画書・技術仕様書**

**Project Name:** Shogo Toyoshima Portfolio v4 (The Final)  
**Role:** Design Engineer / UX Researcher  
**Target:** 採用担当者、クライアント、エンジニアコミュニティ

## **1\. プロジェクトの目的と「勝利条件」**

本プロジェクトは、単なる作品集の作成ではなく、**「更新が続かない」「年1回作り直してしまう」という負のループからの脱却**を主目的とする。

### **勝利条件 (Victory Conditions)**

1. **氏名検索での1位獲得（SEO）**  
   * 技術的な正しさ（SSG/Semantic HTML）をもって、Google検索で最上位に表示されること。  
2. **「生存報告」の自動化・省力化**  
   * 「記事を書く」という高コストな行為に依存せず、日々のログや開発活動が低コストでコンテンツ化される仕組みを構築すること。  
3. **技術的信頼性の証明**  
   * Lighthouseスコア All 100、高速なページ遷移、Edgeでの動的生成など、モダンなWeb技術を使いこなしていることをサイト自体の挙動で証明すること。

## **2\. 技術スタック選定 (Tech Stack)**

「パフォーマンス（ユーザー体験）」と「開発者体験（更新の楽しさ）」の両立を最優先に選定。

| レイヤー | 選定技術 | 選定理由・役割 |
| :---- | :---- | :---- |
| **Framework** | **Astro** | **Island Architecture**による爆速な初期表示。SSRモードを採用し、必要な箇所だけReactを動かす構成が今回の要件（SEO \+ インタラクション）に最適。 |
| **UI Library** | **React** | コマンドパレットや「いいね」ボタンなど、リッチなインタラクションが必要なアイランド（コンポーネント）の実装に使用。 |
| **3D / WebGL** | **R3F / Three.js** | **React Three Fiber (R3F)** を使用して、リッチな3D表現を宣言的に実装する。ポートフォリオの印象的なヒーローセクションや演出に使用。 |
| **Animation** | **Motion** | **Motion (fka Framer Motion)** を使用し、2Dのページ遷移アニメーションやマイクロインタラクションを実装する。 |
| **Styling** | **Tailwind CSS** | クラス名命名の手間を削減し、デザインと実装の試行錯誤を高速化するため。shadcn/ui などのモダンなコンポーネント資産を活用可能。 |
| **CMS** | **Keystatic** | **Git-based CMS**。データベースを持たず、リポジトリ内のMarkdown/MDXファイルを直接管理できる。ローカル（Obsidian）との親和性が高く、Web管理画面も提供されるため。 |
| **Hosting** | **Cloudflare Workers** | D1や環境変数などのバインディングを wrangler.toml でコード管理(IaC)しやすくするため採用。AstroのSSRアダプターを利用し、Workers上でアプリ全体を動作させる。 |
| **Package Mgr** | **pnpm** | 高速かつディスク容量効率が良い。 |

## **3\. システムアーキテクチャ・データフロー**

### **3.1 データ管理と型定義（Data Management）**

データと表示ロジックを分離し、TypeScriptを活用して堅牢な開発環境を構築する。

1.  **型の分離 (`src/types/`)**:
    *   データ構造を定義するインターフェース（`interface` / `type`）のみを管理。
    *   例: `NavigationLink`, `ProjectInfo`, `SiteConfig`
2.  **データの分離 (`src/data/`)**:
    *   TypeScriptファイル（`.ts`）で静的データを管理・エクスポートする。
    *   **汎用データ**: ナビゲーションメニュー、SNSリンク、基本プロフィール情報など、サイト全体で共有されるデータ。
    *   **ページ個別データ**: 各ページのヒーローセクションの文言や、特定のセクションでのみ使用する設定値。
3.  **CMSデータ (`src/content/`)**:
    *   ブログ記事やプロジェクト詳細など、頻繁に更新・追加されるコンテンツはKeystatic (Markdown/MDX) で管理。

### **3.2 コンテンツパイプライン（省力化の肝）**

「Obsidianで思考し、AIでまとめ、Gitで公開する」フローを確立する。

1.  **Input (Local):** Obsidianで日々の学習・開発ログを記録（音声入力活用）。  
2.  **Process:** AI（Gemini/ChatGPT）が要約・整形し、Markdownファイルを生成。  
3.  **Bridge:** 自作スクリプトがMarkdownと画像をAstroプロジェクト（src/content）へ同期。  
4.  **Deploy:** GitHubへPush → GitHub Actions等で wrangler deploy を実行し、Workers環境へデプロイ。

### **3.3 動的機能（遊び心の肝）**

静的サイトでありながら、CloudflareのEdge機能を活用して動的な体験を提供する。

*   **Analytics:** **Cloudflare Web Analytics** (Workerが返すHTMLにJSタグを埋め込み利用。データ取得はGraphQL API経由)  
*   **Database:** **Cloudflare D1** (SQLite) \- 「いいね」数のカウント、簡易的なログ保存  
*   **Backend:** **Astro SSR Endpoints** (on Workers) \- D1へのアクセス、GitHub API（コミットログ取得）、Satori（OGP生成）のエンドポイント

## **4\. 機能要件 (Functional Requirements)**

### **A. 必須機能 (Core Features)**

1.  **ポートフォリオ/実績一覧:**  
    *   画像、タイトル、使用技術タグ、概要、リンク。  
    *   Keystaticから管理可能。  
2.  **開発ログ (Blog):**  
    *   Markdown/MDX形式。Zenn/Qiitaなどの外部記事へのリンクのみを貼る「Link Post」形式もサポート。  
3.  **動的OGP生成 (Satori):**  
    *   記事のタイトル、カテゴリー、ロゴを含む画像を、Edge Function上でJSXからオンデマンド生成する。  
    *   Twitter等でのシェア時にリッチなカードを表示。

### **B. インタラクション機能 (Playful Features)**

4.  **3D演出 (R3F):**
    *   ヒーローセクションなどで、WebGLを用いたインタラクティブな表現を実装する。
5.  **アニメーション (Motion):**
    *   ページ遷移時のフェードイン/アウト。
    *   要素の出現アニメーションや、ホバー時のマイクロインタラクション。
6.  **サーバーレス「いいね」ボタン:**  
    *   ログイン不要、連打可能。  
    *   ReactコンポーネントからAPIエンドポイント経由でD1を更新・参照。  
    *   押した瞬間にパーティクルが飛ぶなどのフィードバック（Motion等を使用）。  
7.  **コマンドパレット (Cmd+K):**  
    *   サイト内検索、ページ移動、テーマ切り替え、外部SNSへのリンク。  
    *   ライブラリ: kbar または cmdk を採用。  
8.  **最新コミットログ表示:**  
    *   フッター部分にGitHub API経由で「このサイトの最新の更新（コミットメッセージ）」を表示し、生存を確認させる。

### **C. 分析機能**

9.  **Web Analytics:**  
    *   PV数、人気ページ、流入元（Referrer）の可視化。  
    *   API経由でサイト上に「今週の注目記事」などを表示するギミックも検討。

## **5\. デザイン・UX方針**

*   **コンセプト:** "Developer's Garage"  
    *   洗練されているが、どこか実験室のような、作り手の気配がする場所。  
*   **トーン & マナー:**  
    *   ベースはシンプルで読みやすく（Astroの長所）。  
    *   マイクロインタラクションにはこだわり、触っていて気持ちいい挙動（React + Motionの長所）を盛り込む。  
    *   ダークモード対応（システム設定準拠 \+ 手動切り替え）。  
*   **ナビゲーション:**  
    *   実験的なUIを試しても良いが、グローバルナビゲーションだけは標準的で迷わないものにする。

## **6\. ディレクトリ構造案 (Astro)**

Next.jsなどの大規模開発に近い構成を採用し、共通部分とページ固有部分を明確に分離する。

```text
src/
├── components/       # UIコンポーネント
│   ├── common/       # サイト全体で使われる共通コンポーネント (Header, Footer, Buttonなど)
│   └── pages/        # ページごとのコンポーネント
│       ├── home/     # トップページ用 (Hero, About, Worksなどセクションごと)
│       ├── blog/     # ブログページ用
│       └── projects/ # 実績詳細ページ用
├── content/          # 記事データ (Keystatic管理)
│   ├── blog/         # 開発ログ MDX
│   └── projects/     # 実績 MDX
├── data/             # 静的データ (TypeScript定数)
│   ├── common/       # 共通データ (navigation.ts, socialLinks.ts)
│   └── pages/        # ページ固有データ (homeData.tsなど)
├── types/            # TypeScript型定義
│   ├── common.ts     # 共通の型
│   └── data.ts       # データの型定義
├── layouts/          # 共通レイアウト
├── pages/            # ルーティング (Astroファイル)
│   ├── index.astro
│   ├── blog/[...slug].astro
│   ├── og/[...slug].png.ts  # SatoriによるOGP生成エンドポイント
│   └── api/          # 内部API (Astro Endpointsとして実装)
│       ├── like.ts   # いいね機能
│       └── stats.ts  # Analytics取得
├── assets/           # 画像など
└── utils/            # ヘルパー関数
wrangler.toml         # Cloudflare Workers設定 (D1バインディング等を記述)
keystatic.config.ts   # Keystatic設定ファイル
astro.config.mjs      # Astro設定 (adapter: cloudflare)
```

## **7\. 実装・最適化ガイドライン (Implementation Guidelines)**

### **7.1 画像最適化とコンポーネント合成 (Image Optimization & Composition)**

Reactコンポーネント内でAstroの強力な画像最適化（`astro:assets`）の恩恵を受けるため、以下の設計ルールを徹底する。

*   **基本ルール:** Reactコンポーネント (.tsx) 内で画像のパス解決や最適化を行わない。
*   **Composition Pattern:**
    *   Reactコンポーネントは「枠（Frame）」として実装し、画像は `children` または `props` (ReactNode) として受け取る。
    *   画像の生成（`<Picture />` の使用）は、必ず親である `.astro` ファイル内で行う。
*   **バケツリレーの回避:**
    *   深い階層のReactコンポーネントに画像を渡す場合も、トップレベルの `index.astro` 等でコンポーネントを組み立て（ネスト）ることで、中間のコンポーネントが画像を知らなくて済むようにする。

```astro
// 例: index.astro
// 画像の最適化はAstro側で行い、Reactには「完成した要素」として渡す
<CardWrapper client:load>
  <Picture slot="thumbnail" src={img} formats={['avif', 'webp']} alt="" />
</CardWrapper>
```

### **7.2 スケルトンローディング (Skeleton Loading)**

専用ライブラリ（react-loading-skeleton等）は使用せず、標準的なCSS (Tailwind) のみで解決し、バンドルサイズを削減する。

*   **動的パーツのロード中:**
    *   単純な `div` に `animate-pulse` `bg-gray-200` `dark:bg-gray-800` を適用したスケルトンコンポーネントを表示する。
*   **画像のロード中 (Image Loading Strategy):**
    *   画像を囲む親要素（ラッパー）の背景に `animate-pulse` を適用しておく。
    *   画像がロードされ表示された時点で、物理的に背景が隠れる（Coverされる）挙動を利用する。
    *   JSによるロード完了検知ロジック（`onLoad`イベントハンドリング等）を不要にし、実装コストを最小化する。

```jsx
// 画像スケルトンの実装イメージ (React/Astro共通の考え方)
<div className="relative overflow-hidden bg-gray-200 animate-pulse dark:bg-gray-800">
  {/* 画像がロードされると、このimgが前面に表示され、背景のpulseを覆い隠す */}
  <img src={src} className="relative z-10 w-full h-full object-cover" alt="" />
</div>
```
