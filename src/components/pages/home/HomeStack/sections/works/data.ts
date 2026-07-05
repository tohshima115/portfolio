// WORKS pin carousel で使うデータ定義。
// プロジェクトを増減させる場合はここだけを編集する。

import sweptHero from '@/assets/projects/swept-hero.png';
import type { ImageMetadata } from 'astro';

export interface Project {
    id: string;
    slug: string;
    name: string;
    meta: string;
    description: string;
    /** 実演動画/静止画のposter。無ければ抽象プレースホルダー表示にフォールバック。 */
    poster?: ImageMetadata;
    /** 将来 mp4 を差し込む用。今は未用意なので常に undefined。 */
    videoSrc?: string;
}

export const PROJECTS: Project[] = [
    {
        id: '01',
        slug: 'aichatclip',
        name: 'AIChatClip',
        meta: '個人開発 · Chrome / Firefox · Ongoing',
        description:
            'AI チャットの回答って、放っておくと履歴の海に沈んでいく。それが気になって、ワンクリックで Obsidian に送り込む拡張機能を作った。Cloudflare で一人で動かしている。',
    },
    {
        id: '02',
        slug: 'internal-tools',
        name: '業務ツールいろいろ',
        meta: 'Design Office · 社内運用',
        description:
            'Web 制作会社で「これは仕組みで何とかした方が早そう」と思った業務を片手間でツール化してきたやつ。PL ダッシュボード / 金属価格の毎日スクレイピング / カレンダー+LINE 配信などをまとめている。',
    },
    {
        id: '03',
        slug: 'swept',
        name: 'Swept',
        meta: '社会起業 · チームプロジェクト · 2024–2026',
        description:
            '3人チームの社会起業プロジェクトに約2年関わった。デザイナーとして入って、途中から実装も担うようになった。方向性の違いで 2026 年初頭に離脱。',
        poster: sweptHero,
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
