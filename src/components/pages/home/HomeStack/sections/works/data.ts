// WORKS pin carousel で使うデータ定義。
// プロジェクトを増減させる場合はここだけを編集する。

export interface Project {
    id: string;
    name: string;
    meta: string;
    description: string;
}

export const PROJECTS: Project[] = [
    {
        id: '01',
        name: 'AIChatClip',
        meta: '個人開発 · Chrome / Firefox · Ongoing',
        description:
            'AI チャットの回答って、放っておくと履歴の海に沈んでいく。それが気になって、ワンクリックで Obsidian に送り込む拡張機能を作った。Cloudflare で一人で動かしている。',
    },
    {
        id: '02',
        name: '業務ツールいろいろ',
        meta: 'Design Office · Cloudflare D1 · 社内運用',
        description:
            'Web 制作会社で「これは仕組みで何とかした方が早そう」と思った業務を片手間でツール化してきたやつ。PL ダッシュボード / 経費入力の自動化 / カレンダー+LINE 配信などをまとめている。',
    },
    {
        id: '03',
        name: 'Swept',
        meta: '社会起業 · チームプロジェクト · 2024–2026',
        description:
            '3人チームの社会起業プロジェクトに約2年関わった。デザイナーとして入って、途中から実装も担うようになった。方向性の違いで 2026 年初頭に離脱。',
    },
];

// 本番投入している Cloudflare サービス。Hero の chip 表示で使う。
export const CLOUDFLARE_SERVICES = [
    'Workers',
    'D1',
    'R2',
    'Durable Objects',
    'Workers AI',
    'Zero Trust',
];
