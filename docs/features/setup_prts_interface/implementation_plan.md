# PRTS UI 実装計画

## 1. 目的
ユーザーが提供した「PRTS Interface」の実装コンセプトを実現し、Astroプロジェクトに統合する。
Three.jsなどの重いライブラリではなく、CSSと軽量なJavaScript（React）で3D効果を演出する。

## 2. 実装詳細

### コンポーネント: `src/components/PrtsInterface.tsx`
- **機能**:
    - マウスの動きに連動してUIが回転（`rotateX` / `rotateY`）。
    - 擬似的な3D効果（`perspective: 1000px`, `transform-style: preserve-3d`）。
    - 画面四隅のボケ表現（グラデーションオーバーレイ）。
- **技術スタック**:
    - React Hooks (`useRef`, `useState`, `useEffect` - 必要に応じて)
    - Tailwind CSS (スタイリング)

### ページ: `src/pages/index.astro`
- メインレイアウトのトップ（ファーストビュー）に配置。
- Astroのアイランドアーキテクチャを活用し、Reactコンポーネントとしてマウント。

### 環境要件
- Astro 5.x (Node.js >= 18.20.8)
- React >= 18

## 3. 手順

### 3.1 準備
1. Node.jsバージョンをv22に更新（`pnpm env use --global 22`）。
2. React統合をインストール（`pnpm astro add react`）。

### 3.2 コンポーネント作成
1. `src/components/PrtsInterface.tsx` を新規作成。
2. ユーザー提供のコードをペーストし、適宜調整（Tailwindクラスの微調整などが必要であれば）。

### 3.3 ページ修正
1. `src/pages/index.astro` を編集。
2. `<PrtsInterface client:load />` を挿入。

### 3.4 動作確認
1. `pnpm dev` でサーバーを起動。
2. ブラウザで確認。

## 4. 懸念点・注意点
- **パフォーマンス**: CSSのみなので軽量だが、過剰なDOM要素や重い計算は避ける。提供コードはシンプルで問題ないはず。
- **SEO**: コンテンツはHTMLとして存在するため、検索エンジンはテキストを正しく認識できる。
