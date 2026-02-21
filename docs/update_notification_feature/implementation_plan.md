# 実装計画

1. **データスキーマの更新**
   - `src/content/config.ts` の `projects` の `meta` オブジェクト内に `updatedDate: z.coerce.date().optional()` を追加する。
   - すでに `blog` コレクションには `updatedDate` が存在するため、実績・ブログの両方で同等に扱えるようにする。

2. **Keystatic設定の更新**
   - `keystatic.config.ts` の `projects` と `blog` コレクションのスキーマに `updatedDate: fields.date({ label: '最終更新日' })` などを追加する。

3. **トップページ (Astro) のデータ抽出処理**
   - `src/pages/index.astro` にて、`getCollection('projects')` と `getCollection('blog')` を呼び出しデータをマージする。
   - `updatedDate` (または `date`/`pubDate`) に基づいて降順にソートし、上位3件を抽出する。
   - 抽出したデータを Props として `PrtsInterface` に渡す。

4. **コンポーネントツリーのProps更新**
   - `PrtsInterface` -> `NavigationLayer` -> `StatusBadges` の順に更新データ（`updates`配列）をPropsで受け取るよう TypeScript のインターフェースを定義し、伝播させる。

5. **StatusBadges コンポーネントの実装**
   - 現状の "SYSTEM ONLINE" バージョンを "LATEST UPDATES" のような表示（あるいはそのまま SYSTEM ONLINE）にし、ホバー時に最新3件の更新情報（タイトル・日付）を表示するポップオーバー UI を追加する。
   - ボタングループ自体をクリックした際に、`/updates` のページへ遷移するようにリンク (`<a href="/updates">`) でラップする等の実装を行う。

6. **更新一覧ページ (/updates) の新規作成**
   - `src/pages/updates.astro` を作成する（Astro コンポーネント）。
   - ここでは全ての（もしくは一定件数の）プロジェクトとブログを統合し、日付降順で一覧表示する UI を作成する。他の `/works` や `/blog` とデザインを調和させる。

7. **ドキュメント類の更新**
   - `README.md` または `technical_spec_portfolio.md` に更新日付機能を追加した旨を追記する。
