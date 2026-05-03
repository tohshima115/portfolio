# 実装計画

1. **Content Schema の更新**
   - `src/content/config.ts` の `blog` コレクション定義に `tags: z.array(z.string()).optional()` を追加する。
   - `src/content/blog/` 以下のサンプル Markdown ファイル3つに `tags` フロントマターを追加する。

2. **ブログ一覧ページの更新 (`src/pages/blog/index.astro`)**
   - `works/index.astro` を参考に、ブログデータとタグデータからグラフ用ノードを作るロジック(`graphNodes`, `graphLinks`)を構築する。
   - 画面を右側にグラフエリア（`SystemGraph`）を持つ分割レイアウトにし、左側にブログリストを表示するように修正する。
   - ブログリストアイテムに各々のタグを表示する。（バッジデザインはUI統一を考慮）

3. **ブログ詳細ページの更新 (`src/pages/blog/[...slug].astro`)**
   - 既存のシンプルな1カラムレイアウトを、`works` の詳細ページを模したような3カラムレスポンシブレイアウトに変更する (`grid-cols-12`)。
   - **左カラム**: 記事内の見出し（`post.render()`から取得した `headings`）を元にページ内リンク（アンカー）を持つ目次リストをレンダリングする。
   - **中央カラム**: メインのブログコンテンツ（`<Content />`）を配置し、`prose` クラス群を用いてスタイルをあてる。
   - **右カラム**: 当該のブログ記事に関連付けられたタグ情報に絞って `SystemGraph` を生成し表示する。
