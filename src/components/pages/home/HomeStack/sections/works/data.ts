// WORKS pin carousel で使うデータ定義。
// プロジェクトを増減させる場合はここだけを編集する。

export interface Project {
    id: string;
    slug: string;
    name: string;
    description: string;
    /** public/ 配下のループ再生動画パス (例: /works/swept-hero.webm)。 */
    videoSrc?: string;
}

export const PROJECTS: Project[] = [
    {
        id: '01',
        slug: 'aichatclip',
        name: 'AIChatClip',
        description:
            'AI チャットの回答って、放っておくと履歴の海に沈んでいく。それが気になって、ワンクリックで Obsidian に送り込む拡張機能を作った。Cloudflare で一人で動かしている。',
        videoSrc: '/AIChatClip/aichatclip.webm',
    },
    {
        id: '02',
        slug: 'swept',
        name: 'Swept',
        description:
            '3人チームの社会起業プロジェクトに約2年関わった。デザイナーとして入って、途中から実装も担うようになった。方向性の違いで 2026 年初頭に離脱。',
        videoSrc: '/works/swept-hero.webm',
    },
    {
        id: '03',
        slug: 'kodaira-tsunagari-fes',
        name: 'こだいらつながりフェス',
        description:
            '小平市内60〜70団体が同日分散開催するイベントの、パンフレット裏面マップを制作。会場・時刻・団体情報を1枚に集約し、幅広い年齢層が説明なしで読める情報設計にした。',
        videoSrc: '/kodaira-tsunagari-fes/kodaira-tsunagari-fes.webm',
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
