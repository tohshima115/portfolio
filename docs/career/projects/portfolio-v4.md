# Portfolio Renewal v4 — 質問リスト

> サイトソース: `src/content/projects/portfolio-v4.mdx`
> ライブ: https://toyoshima.work (= このサイト本体)
> 音声メモ: `docs/career/projects/voice-memos/portfolio-v4-*.md`

## 1. 現状サイトに載っている内容

- 「更新が続かない / 年 1 回作り直す」負のループからの脱却が動機
- "Process of Elimination" Design = 装飾を引かずあえて高密度のインダストリアル (Endfield 風)
- 機能美としての UI / スペックシート的メタデータ / 警告色 (Yellow #FACC15)
- Astro + Keystatic + Tailwind で SSG + ローカル CMS
- Lighthouse スコア All 100 を達成、と書いている

## 2. 採用担当目線で欲しい情報 (質問リスト)

### ★★★ 必須級

1. **Lighthouse 100 のキャプチャと現在の実数値**
   - 「達成しました」と書いてあるが**スクショが無い**。Performance / Accessibility / Best Practices / SEO の 4 軸を本番 URL で計測したスクショを Outcome に置きたい
   - 現状もし 100 を割っているなら正直な数字に書き直す (虚偽は致命傷)
   - → 「定量で示せるエンジニア」の証拠になる

2. **PRTS / Endfield 風インダストリアルデザインのリファレンス開示**
   - Inspirations の元ネタ (PRTS = アークナイツ管理画面 / Endfield = Arknights: Endfield UI)
   - 「リファレンスがある」と明記する方が逆に誠実
   - リファレンスをどう抽象化して自分のテイストに落としたかの 1 段落

3. **3D 演出の実装スタック (R3F? CSS 3D? Plain WebGL?)**
   - 現状 mdx に書いていない
   - SSR との両立をどうしたか / SSG で 3D 演出はどう動かしているか
   - パフォーマンスバジェット (FPS / 初期ロード時間)
   - モバイルでの動作と劣化フォールバック

4. **デプロイ / CI / プレビュー環境の構成**
   - Cloudflare Pages or Workers どちら?
   - GitHub Actions or 直接プッシュ?
   - Preview deploys は機能している?
   - → 「自分のサイトを Cloudflare で動かしている」が Stance の生きた証拠になる

### ★★ あると差別化される

5. **Keystatic を選んだ理由 (mdx 直編集 / Notion / Sanity との比較)**
   - Git ベースであることのメリット (本人感覚)
   - 編集体験はどうか / 妥協した点
   - → コンテンツ管理の判断軸を語れる

6. **更新を続ける仕組み**
   - 月 N 本のターゲットがあるか
   - Blog の最新記事更新が止まっている場合、戻す計画
   - 「更新が続かない」を解消する具体的な仕掛けが mdx に書かれているが、運用されているかの自己評価

7. **アクセシビリティ (a11y) の対応**
   - Round 2 voice memo: 本人興味薄
   - ただし mdx に書く以上は最低ラインの担保 (キーボード操作 / コントラスト比 / aria-* / prefers-reduced-motion)
   - 高密度インダストリアル UI は a11y と緊張関係にあるため、どこを取ったか

8. **Lighthouse 100 を「1 点単位で詰める作業はやらない」方針 (site-improvement-plan.md と整合)**
   - 100 を達成した手段の概要 (画像最適化 / フォント戦略 / JS ハイドレーション戦略)
   - もし 100 でない場合「90 以上で十分」と割り切った正直な記述に

### ★ 余裕があれば

9. SystemGraph (D3 force) の実装根拠 / Projects と Blog で活用している看板機能
10. PRTS インターフェースの初回入場アニメ ── seasonStorage 等で初回のみに限定する計画
11. OGP 動的生成 (Satori on Workers) の計画進捗
12. Cloudflare Web Analytics の設定有無
13. JSON-LD Person Schema の追加 (SEO 強化)
14. ダーク固定の判断 (現状ダーク、ライト不要の判断軸)
15. RSS / sitemap の生成と確認 URL
16. ブログのいいねボタン (D1 実証) などの動的機能の優先度

## 3. このプロジェクトが伝えたい命題

- ✅ **デザインも実装も自分でできる → このサイト自体が証拠**
- ✅ **Cloudflare で動かしている → Stance の生きた証明**
- ✅ **更新が続く仕組みを設計できる**
- ⚠️ Lighthouse 100 / a11y / SSR-3D など、書いていることと実態が合っているか要再点検

## 4. 音声メモ反映フロー

1. Lighthouse スコア計測のスクショ取得 → 公開判断 (実数で書き直すか、達成ライン未到達なら mdx 修正)
2. 3D / R3F の実装スタックを 1 段落 mdx に追加するか検討
3. デプロイ構成を 1 段落 mdx に追加 (Cloudflare 使用が一番わかる証拠)

## 5. メモ・回答記録欄

(空)
