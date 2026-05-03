# 修正内容の確認 (Walkthrough)

## ブログ構成の設定
* `src/content/config.ts` でブログコレクションのスキーマを追加。`pubDate` や `title` などのプロパティを定義。

## ブログ記事の作成
* `src/content/blog/sample-1.md` などのサンプルデータを3つ作成。テック系やエンジニアリング系の適当なテーマで執筆。

## ビューの対応
* `src/pages/blog/index.astro` を使用可能にし、`getCollection('blog')` 呼び出しにより記事一覧が表示されるよう修正。
* 表示される個々の記事に対してリンクや日付が表示できるコンポーネント構造に変更。
* `src/pages/blog/[...slug].astro` にて個別の記事にアクセスし、内容がレンダリングされるようにページを追加。
