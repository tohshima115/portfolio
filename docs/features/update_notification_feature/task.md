# タスクリスト

- [x] ドキュメント用フォルダの作成と初期ドキュメント配置
- [x] `src/content/config.ts` の `projects` コレクションスキーマに `updatedDate` (最終更新日時) を追加
- [x] `keystatic.config.ts` の `projects` および `blog` に `updatedDate` フィールドの編集 UI を追加
- [x] `src/pages/index.astro` で `projects` と `blog` のコンテンツを取得・マージし、最新3件を抽出するロジックを実装
- [x] 抽出した最新3件のデータを `<PrtsInterface>` -> `<NavigationLayer>` -> `<StatusBadges>` コンポーネントへと Props 経由で伝播するよう修正
- [x] `StatusBadges.tsx` の "SYSTEM ONLINE" バッジを修正し、ドロップダウンUI (ホバー時に最新3件を表示) およびクリック時に `/updates` へ遷移する機能を実装
- [x] `src/pages/updates.astro` (更新一覧ページ) を新規作成し、日付降順で全件表示するUIを実装
- [x] `README.md` または `technical_spec_portfolio.md` に更新日時 (`updatedDate`) の追加と仕様を追記
- [x] `implementation_plan.md` および `walkthrough.md` の作成・更新
