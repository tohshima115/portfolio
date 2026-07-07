// WORKS pin carousel で使うデータ定義。
// プロジェクトを増減させる場合はここだけを編集する。

import sweptHero from '@/assets/projects/swept-hero.png';
import type { ImageMetadata } from 'astro';

export interface Project {
    id: string;
    slug: string;
    name: string;
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
        description:
            'AI チャットの回答って、放っておくと履歴の海に沈んでいく。それが気になって、ワンクリックで Obsidian に送り込む拡張機能を作った。Cloudflare で一人で動かしている。',
    },
    {
        id: '02',
        slug: 'swept',
        name: 'Swept',
        description:
            '3人チームの社会起業プロジェクトに約2年関わった。デザイナーとして入って、途中から実装も担うようになった。方向性の違いで 2026 年初頭に離脱。',
        poster: sweptHero,
    },
    {
        id: '03',
        slug: 'foclock',
        name: 'Foclock',
        description:
            'SNSや動画サイトに溶かされる時間を取り戻すためのサイトブロッカー拡張機能。コア機能は無料、$3 の買い切りで高度機能が使える設計。拡張機能 + Web + 管理画面 + API を全部 Cloudflare で組んでいる、開発中のプロジェクト。',
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
