# Schedule Distributor — 質問リスト

> サイトソース: `src/content/projects/schedule-distributor.mdx`
> ライブ: 非公開 (社内 Electron アプリ)
> 音声メモ: `docs/career/projects/voice-memos/schedule-distributor-*.md`

## 1. 現状サイトに載っている内容

- 社内ルール: 日々の予定を Google Calendar に登録 + 同じ内容を LINE に残す → 二重入力が毎日 30 分前後消費
- 1 つのフォーム (テキスト or 音声) から Google Calendar 登録と LINE 投稿用文書を分配する
- 期間: 約 3 日
- Stack: TypeScript / LLM API / Whisper / Google Calendar API / Google Cloud Console
- 役割: 課題発見 / 設計 / 実装 / チーム導入

## 2. 採用担当目線で欲しい情報 (質問リスト)

> **本人補足 (Round 2 voice memo)**: Electron で作った Windows ソフト。GCP の Calendar API 連携を学ぶ目的が大きい。「今だったら AI チャットサービスだけで事足りる」自覚あり。

### ★★★ 必須級

1. **mdx の Stack に Electron が無い問題**
   - 現状の Stack 一覧に Electron が無いが、本体は Electron アプリ
   - mdx を修正するか / Web 版もあるなら明示するか要決定

2. **マルチプラットフォーム判断 (Web vs Electron)**
   - Web ではダメだった理由 (LINE 投稿の絡み? デスクトップ通知? OS API 必要?)
   - 「Windows ソフトを作りたかった (= 自分の勉強)」とのバランスを正直に書く価値
   - 採用担当に「学習目的を持って手を動かすエンジニア」と読ませる

3. **Whisper を採用した理由 / 精度評価**
   - OpenAI Whisper API か / ローカル Whisper か
   - 日本語精度 / 専門用語対応
   - 月額コスト or 計算リソース

4. **Google Calendar API + GCP 認証フロー**
   - OAuth 2.0 の同意画面公開 / テストユーザー登録?
   - 個人アカウントごとに認証する設計か / サービスアカウント?
   - Refresh Token の管理

### ★★ あると差別化される

5. **チーム導入の中身**
   - 何人にインストールしてもらったか
   - インストーラーをどう配布したか (社内 Drive / ビルド済みバイナリ?)
   - コード署名 / SmartScreen 警告対策の有無

6. **音声入力 → AI 整形のプロンプト設計**
   - LINE 用文章とカレンダー登録用フォーマットを 1 つの音声から両方出すプロンプト
   - 業務報告フォーマット (本人言及あり) との整合

7. **「これは作らなくてよかった」の自己評価**
   - Round 2 voice memo: 「今だったら AI チャットサービスだけで事足りる」
   - この自己評価をサイトに書くか / 隠すか
   - 書くなら「学習目的があった」「当時はその選択が最適だった」のフレームに整える

8. **Schedule Distributor と他案件の関係**
   - Stack Modernization / PL Dashboard / Expense Automation との重なり順序
   - profile.md ・ AboutDeepDive の History にも「PL ダッシュボード / 金額入力自動化 / Schedule Distributor」と書かれている。Schedule Distributor の正体がこれだと統一されるなら呼称を全体で揃える

### ★ 余裕があれば

9. アイコンやスプラッシュ画面のデザイン
10. アップデート配信の仕組み (electron-updater? 手動?)
11. ログ収集 / エラー報告の設計
12. 退職後のメンテをどうするか (本人去ったら誰がメンテ?)

## 3. このプロジェクトが伝えたい命題

- ✅ **Web 以外のサーフェスも触れる (Electron)**
- ✅ **GCP の認証フローを実装した経験**
- ✅ **学習目的と業務改善を両立するスタンス**
- ✅ **3 日で形にする実装速度 (短期スプリント能力)**

## 4. 音声メモ反映フロー

1. mdx の Stack に Electron 追加するか先に決定
2. 「学習目的だった」を正直に書くフレーム選択 (押し出さない / 控えめに添える / 強調する)
3. Schedule Distributor / カレンダー LINE 自動化 / 音声入力ツール の **呼称統一** を全体で揃える (about-copywriting.md Round 3 質問 5 と連動)

## 5. メモ・回答記録欄

(空)
