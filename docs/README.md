# docs/

このディレクトリは「ポートフォリオサイトの実装ドキュメント」だけでなく、**就職活動全体を支えるナレッジベース**として運用する。

## ディレクトリ構成

```
docs/
├── README.md                       ← このファイル（全体ナビ）
│
├── career/                         ← 就活戦略・自己分析・対外文章
│   ├── profile.md                  ← 自己分析の中心（強み / 経歴 / 狙うポジション / 年収レンジ）
│   ├── site-improvement-plan.md    ← サイトを「採用判断のためのフィルタ」として最適化する計画
│   ├── about-copywriting.md        ← サイト上の About 文章を再考するワーキングドキュメント
│   └── voice-memos/                ← 音声録音から書き起こしたメモを置く場所
│
└── features/                       ← サイトの機能実装メモ（実装プラン / タスク / ふりかえり）
    ├── blog_tags_and_layout/
    ├── create_sample_blogs/
    ├── graph_visualization/
    ├── project_archive_implementation/
    ├── setup_prts_interface/
    └── update_notification_feature/
```

## 役割と置き場のルール

| ドキュメント種別 | 置き場 | 例 |
|---|---|---|
| 自分自身の戦略・自己分析・対外メッセージ | `career/` | profile.md, About 文章ドラフト |
| サイト上のテキスト・コピーの検討 | `career/` | about-copywriting.md, hero-copywriting.md（将来） |
| 採用面接・カジュアル面談の準備メモ | `career/` | interview-prep.md（将来） |
| 応募候補企業のリストや評価 | `career/` | target-companies.md（将来） |
| 音声録音 → 書き起こしの一時メモ | `career/voice-memos/` | YYYY-MM-DD_topic.md |
| サイトの機能実装プラン・タスク・ふりかえり | `features/` | blog_tags_and_layout/ |

## 運用の前提

- `career/` は **公開しない前提** で書く（年収レンジ、避けるべき職種、起業仲間の学歴 等の機微情報を含む）。サイトに載せる文章は、公開可能な形に翻訳して `src/` 配下のコンポーネントに反映する。
- `features/` は実装記録なので公開リポジトリ前提で書いて構わない。
- 自己分析やコピーは「ある時点のスナップショット」として残し、更新する場合は新しいセクションとして追記するか、元の記述に日付付きで上書きする。**過去の自分の判断を辿れる状態** を保つ。
- 音声メモは `career/voice-memos/YYYY-MM-DD_topic.md` の命名で残す（生のテキスト → そこからエッセンスを `career/` 直下のドキュメントに反映）。

## 想定される今後のドキュメント

優先度順:

1. **`career/about-copywriting.md`** — 既存。サイトの About 文を狙うポジションに合わせて磨き込むワーキングドキュメント。
2. **`career/hero-copywriting.md`** — TOP 一画面目で採用担当に刺すヒーローコピー専用の検討。
3. **`career/interview-prep.md`** — カジュアル面談・一次面接で頻出する質問への回答台本。
4. **`career/target-companies.md`** — Wantedly / YOUTRUST / Findy 等で見つけた候補企業リストと、各社向けに強調すべき点。
5. **`career/scout-replies.md`** — スカウト返信・カジュアル面談リクエストの返信テンプレ集。
6. **`career/positioning-checklist.md`** — サイトと自己紹介と職務経歴書の整合性をチェックするためのリスト。
