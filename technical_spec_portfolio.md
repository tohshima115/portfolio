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
| **Styling** | **Tailwind CSS** | クラス名命名の手間を削減し、デザインと実装の試行錯誤を高速化するため。shadcn/ui などのモダンなコンポーネント資産を活用可能。 |
| **CMS** | **Keystatic** | **Git-based CMS**。データベースを持たず、リポジトリ内のMarkdown/MDXファイルを直接管理できる。ローカル（Obsidian）との親和性が高く、Web管理画面も提供されるため。 |
| **Hosting** | **Cloudflare Workers** | D1や環境変数などのバインディングを wrangler.toml でコード管理(IaC)しやすくするため採用。AstroのSSRアダプターを利用し、Workers上でアプリ全体を動作させる。 |
| **Package Mgr** | **pnpm** | 高速かつディスク容量効率が良い。 |

## **3\. システムアーキテクチャ・データフロー**

### **3.1 コンテンツパイプライン（省力化の肝）**

「Obsidianで思考し、AIでまとめ、Gitで公開する」フローを確立する。

1. **Input (Local):** Obsidianで日々の学習・開発ログを記録（音声入力活用）。  
2. **Process:** AI（Gemini/ChatGPT）が要約・整形し、Markdownファイルを生成。  
3. **Bridge:** 自作スクリプトがMarkdownと画像をAstroプロジェクト（src/content）へ同期。  
4. **Deploy:** GitHubへPush → GitHub Actions等で wrangler deploy を実行し、Workers環境へデプロイ。

### **3.2 動的機能（遊び心の肝）**

静的サイトでありながら、CloudflareのEdge機能を活用して動的な体験を提供する。

* **Analytics:** **Cloudflare Web Analytics** (Workerが返すHTMLにJSタグを埋め込み利用。データ取得はGraphQL API経由)  
* **Database:** **Cloudflare D1** (SQLite) \- 「いいね」数のカウント、簡易的なログ保存  
* **Backend:** **Astro SSR Endpoints** (on Workers) \- D1へのアクセス、GitHub API（コミットログ取得）、Satori（OGP生成）のエンドポイント

## **4\. 機能要件 (Functional Requirements)**

### **A. 必須機能 (Core Features)**

1. **ポートフォリオ/実績一覧:**  
   * 画像、タイトル、使用技術タグ、概要、リンク。  
   * Keystaticから管理可能。  
2. **開発ログ (Blog):**  
   * Markdown/MDX形式。Zenn/Qiitaなどの外部記事へのリンクのみを貼る「Link Post」形式もサポート。  
3. **動的OGP生成 (Satori):**  
   * 記事のタイトル、カテゴリー、ロゴを含む画像を、Edge Function上でJSXからオンデマンド生成する。  
   * Twitter等でのシェア時にリッチなカードを表示。

### **B. インタラクション機能 (Playful Features)**

4. **サーバーレス「いいね」ボタン:**  
   * ログイン不要、連打可能。  
   * ReactコンポーネントからAPIエンドポイント経由でD1を更新・参照。  
   * 押した瞬間にパーティクルが飛ぶなどのフィードバック（Framer Motion等を使用）。  
5. **コマンドパレット (Cmd+K):**  
   * サイト内検索、ページ移動、テーマ切り替え、外部SNSへのリンク。  
   * ライブラリ: kbar または cmdk を採用。  
6. **最新コミットログ表示:**  
   * フッター部分にGitHub API経由で「このサイトの最新の更新（コミットメッセージ）」を表示し、生存を確認させる。

### **C. 分析機能**

7. **Web Analytics:**  
   * PV数、人気ページ、流入元（Referrer）の可視化。  
   * API経由でサイト上に「今週の注目記事」などを表示するギミックも検討。

## **5\. デザイン・UX方針**

* **コンセプト:** "Developer's Garage"  
  * 洗練されているが、どこか実験室のような、作り手の気配がする場所。  
* **トーン & マナー:**  
  * ベースはシンプルで読みやすく（Astroの長所）。  
  * マイクロインタラクションにはこだわり、触っていて気持ちいい挙動（Reactの長所）を盛り込む。  
  * ダークモード対応（システム設定準拠 \+ 手動切り替え）。  
* **ナビゲーション:**  
  * 実験的なUIを試しても良いが、グローバルナビゲーションだけは標準的で迷わないものにする。

## **6\. ディレクトリ構造案 (Astro)**

src/  
├── components/       \# UIコンポーネント (React/Astro混在)  
│   ├── Interactive/  \# いいねボタン、CmdKなど (React)  
│   └── Static/       \# ヘッダー、フッターなど (Astro)  
├── content/          \# 記事データ (Keystatic管理)  
│   ├── blog/         \# 開発ログ MDX  
│   └── projects/     \# 実績 MDX  
├── layouts/          \# 共通レイアウト  
├── pages/            \# ルーティング  
│   ├── index.astro  
│   ├── blog/\[...slug\].astro  
│   ├── og/\[...slug\].png.ts  \# SatoriによるOGP生成エンドポイント  
│   └── api/          \# 内部API (Astro Endpointsとして実装)  
│       ├── like.ts   \# いいね機能  
│       └── stats.ts  \# Analytics取得  
├── assets/           \# 画像など  
└── utils/            \# ヘルパー関数  
wrangler.toml         \# Cloudflare Workers設定 (D1バインディング等を記述)  
keystatic.config.ts   \# Keystatic設定ファイル  
astro.config.mjs      \# Astro設定 (adapter: cloudflare)  
