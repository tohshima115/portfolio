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
        meta: 'Flagship · 1 paid · multi-surface',
        description:
            'AI チャット会話を Obsidian に自動同期する SaaS。1 人で企画 / 設計 / UI / 実装 / 運用までを Cloudflare スタックで出荷している。',
    },
    {
        id: '02',
        name: 'PL Dashboard',
        meta: 'Cloudflare D1 · 社内運用',
        description:
            '見にくい Excel を Cloudflare D1 に乗せ換えた業務改善ダッシュボード。デザイン事務所内で月次運用中、Zero Trust で限定公開。',
    },
    {
        id: '03',
        name: 'Swept',
        meta: '起業準備 · プロダクトデザイン',
        description:
            '起業準備中のプロダクト。MVP のプロダクトデザインから検証を進め、Cloudflare 上で 0 → 1 を立ち上げ中。',
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
