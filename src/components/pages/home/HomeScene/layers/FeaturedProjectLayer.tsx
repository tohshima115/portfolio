import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface Props {
    progress: MotionValue<number>;
}

const tldr = [
    { k: 'Role', v: '企画 / 設計 / UI / 実装 / 運用 / マーケまで 1 人で完結' },
    { k: 'Stack', v: 'Cloudflare Workers · D1 · Durable Objects · Workers AI · WXT · Obsidian' },
    { k: 'Status', v: 'Chrome / Firefox ストア公開 · 課金実装 · 有料ユーザー獲得' },
    { k: 'Highlight', v: '拡張機能 + Web + API + Obsidianプラグイン + Realtime 同期 のマルチサーフェス' },
];

export const FeaturedProjectLayer = ({ progress }: Props) => {
    // セクション 2 (Featured) は progress 0.4 中心。前後にフェード。
    const opacity = useTransform(progress, [0.26, 0.36, 0.46, 0.56], [0, 1, 1, 0]);
    const yOffset = useTransform(progress, [0.26, 0.4, 0.56], [40, 0, -40]);

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(92vw,920px)] pointer-events-auto"
        >
            <div className="border border-foreground/15 bg-background/70 backdrop-blur-xl px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">
                        + FLAGSHIP / 02
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                        AICHATCLIP
                    </span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[0.95] mb-4">
                    AI チャットを Obsidian に
                    <br />
                    自動同期する SaaS。
                </h2>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl mb-6">
                    Cloudflare のエッジで動く個人開発プロダクト。ブラウザ拡張で会話を取得し、Workers AI でタイトル / タグを生成、Durable Objects 経由の WebSocket で Obsidian にリアルタイム同期する。
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-6 gap-y-3 text-sm mb-8">
                    {tldr.map((row) => (
                        <div key={row.k} className="contents">
                            <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground pt-1">
                                {row.k}
                            </dt>
                            <dd className="text-foreground/85 leading-relaxed">
                                {row.v}
                            </dd>
                        </div>
                    ))}
                </dl>

                <div className="flex items-center gap-4">
                    <a
                        href="/projects/aichatclip"
                        className="group inline-flex items-center gap-2 px-5 h-10 bg-foreground text-background font-mono text-[10px] tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Open Case Study
                        <svg
                            className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </a>
                    <a
                        href="/projects"
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                        All Projects →
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
