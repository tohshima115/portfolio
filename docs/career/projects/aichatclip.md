# AIChatClip — 質問リスト

> サイトソース: `src/content/projects/aichatclip.mdx`
> ライブ: https://aichatclip.com (Chrome / Firefox / Obsidian Plugin)
> 音声メモ: `docs/career/projects/voice-memos/aichatclip-*.md`

## 1. 現状サイトに載っている内容

- TL;DR: AIチャット (ChatGPT / Claude / Gemini / Grok) の回答をワンクリックで Obsidian / Notion / Webhook に同期する個人開発 SaaS。1 人で企画→運用まで完結
- Status: Chrome / Firefox ストア公開済み / 課金実装済み / 有料ユーザー獲得済み
- Architecture: Browser Extension (WXT) → Hono on Workers (Better Auth / Workers AI / D1 / Durable Object) → Obsidian Plugin
- 設計判断: Durable Objects + WebSocket / Better Auth / Workers AI / WXT / Turborepo の 5 つを言語化済み
- 数字: 無料登録 1 日 1 人ペース・1 ヶ月で 30 人前後 / 有料 1 名
- 今後の課題: Free → Pro 誘導 / SEO / オンボーディング磨き

## 2. 採用担当目線で欲しい情報 (質問リスト)

### ★★★ 必須級 — これがないと判断材料が足りない

1. **Cloudflare 運用規模の数字 (現時点 / 直近の伸び)**
   - 月間リクエスト数 (Workers Invocations)
   - D1 行数・サイズ
   - Workers AI 月間呼び出し数 (BGE-M3 / Qwen3-30B 別)
   - Durable Objects アクティブ数 / Hibernation 復帰頻度
   - 月額 Cloudflare コスト (USD or JPY)
   - Stripe 課金額 (月次)
   - → 1 つでも数字が確定すれば mdx の Status & Outcome に追記する

2. **「これは想定どおりに動かなかった」失敗・学び 3 つ**
   - 具体例: Durable Objects の Hibernation API で詰まったポイント / WebSocket 切断時のリカバリ設計 / Workers AI の出力品質ばらつき / D1 のクエリ速度 / OAuth フローでの罠
   - 「作った」だけでなく「やり直した」が見えると一気に厚くなる
   - これは Bio の "SSR/SSG で何度も詰まった" と並ぶ証拠になる

3. **MVP 検証で 1,000 円課金意思を確認した友人 ── 検証から実装着手までの判断ライン**
   - 1 人の即決でなぜ「行ける」と判断したのか (1 人だけなら N=1 では?)
   - 友人以外にも検証したか / しなかったとしたら理由
   - 「課金が即決される」以外に着手の根拠としたシグナル
   - → 採用担当は「事業視点を持つエンジニア」を確認したい。即決 1 人で着手する判断は強気にも見え、根拠を 1 段添えると説得力増

4. **「拡張機能 + Web + API + Obsidian Plugin + Realtime」のコード共有戦略の具体**
   - Turborepo で `shared` パッケージに何を入れたか (型 / スキーマ / API クライアント / Util?)
   - 4 サーフェス間で「型 1 行直したら全部に反映される」例を 1 つ
   - 重複を許容した部分はどこか (許容のトレードオフ)

5. **次のロードマップ (3〜6 ヶ月)**
   - Free → Pro 誘導の仮説と打ち手
   - 機能追加か / マーケかの優先順位
   - 自分が転職した後どうメンテし続けるか / クローズか

### ★★ あると差別化される

6. **競合分析**
   - Glasp / Save AI Chats / Notion Web Clipper / ChatGPT Saver / Heptabase など、近接サービスとの比較
   - 「AIChatClip だけが解いている課題」を 1 つ
   - 競合より弱い部分も正直に書く (出荷判断ができる人は競合理解が深い)

7. **オンボーディング改善 ── ユーザーテストの中身**
   - 何人 (Round 2 voice memo: 2 人) / どんなプロファイル (IT 苦手な友人含む)
   - 詰まった具体ポイント Top 3
   - 改善 before/after (git commit から再現可能、とのこと)

8. **マルチ AI チャット対応の設計**
   - ChatGPT / Claude / Gemini / Grok それぞれ DOM 構造が違う中、抽出ロジックをどう抽象化したか
   - 新しい AI チャットサービスが出たとき何時間で対応できる設計か
   - ベンダーの DOM 変更で壊れるリスクのモニタリング

9. **Workers AI のプロンプト・モデル選定理由**
   - なぜ Qwen3-30B か (Llama 3.3 / Mistral / GPT-oss などとの比較)
   - BGE-M3 をタイトル衝突回避「だけ」に使う設計の意図
   - プロンプトテンプレを公開できる範囲で

10. **コード公開戦略の判断**
    - サイトでは「主要コードは商用運用中のため非公開」と書いている
    - GitHub に薄いプロフィール用リポジトリを作る計画
    - 商用と公開の線引きをどう設計しているか

### ★ 余裕があれば

11. ストア審査で詰まった経験 (Chrome / Firefox それぞれ)
12. プロモーション動画 (Remotion 制作) の閲覧数 / 効果実感
13. 課金実装で Stripe を選んだ理由 / Lemon Squeezy / Polar との比較有無
14. ロゴデザインの意図 / 配色の根拠 (Material Design 2 / 3 を読み込んでいる本人なら語れる)
15. SEO 仮設定の中身 (sitemap / 構造化データ / OGP の現状)
16. アクセシビリティ対応の現状 (本人興味薄と Round 2 で言及あり、現状ライン明示が必要)
17. プライバシー設計 (AI チャット内容を保存する仕組みでの個人情報配慮)

## 3. このプロジェクトが伝えたい命題

- ✅ **Cloudflare スタックでプロダクションを 1 人で出荷・運用できる**
- ✅ **拡張機能 / Web / API / Obsidian Plugin / Realtime 同期 を横断で設計できる**
- ✅ **仮説検証 → 出荷 → 運用までを自走できる事業視点を持つエンジニア**

これらを「コードは見せられないが、設計判断と動くプロダクトで証明する」のが mdx の役割。

## 4. 音声メモ反映フロー

1. 質問のうち答えやすいものから音声で回答 → `voice-memos/aichatclip-N.md`
2. アシスタントに反映依頼 → 5 章「メモ・回答記録欄」に要点整理
3. mdx (`src/content/projects/aichatclip.mdx`) に反映する分と、面接ストックに留める分を分ける
4. 数字・失敗エピソードは Status & Outcome / 設計上の意思決定に反映優先

## 5. メモ・回答記録欄

(まだ無し。voice memo を反映するときにここに整理して書き溜める)
