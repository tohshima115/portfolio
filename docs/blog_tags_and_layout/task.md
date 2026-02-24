# ブログへのタグ機能の追加とグラフ・目次の配置

## 目標
1. `blog` の Content Collection スキーマに `tags` を追加し、各記事にタグを付与できるようにする。
2. ブログ一覧ページ(`src/pages/blog/index.astro`)の右側に、記事とタグの関連性を示す `SystemGraph` を配置する。
3. ブログ詳細ページ(`src/pages/blog/[...slug].astro`)を3カラムレイアウトに刷新し、左側に目次（Table of Contents）、中央に記事内容、右側に当該記事と関連する `SystemGraph` を表示する。
