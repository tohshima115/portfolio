import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

const facts = [
    { k: 'Background', v: '東京理科大学 経営学部卒 → デザイナー → 個人開発' },
    { k: 'Stack', v: 'Cloudflare · TypeScript · React Router v7 · Astro · Hono' },
    { k: 'Stance', v: '個人開発・スタートアップに優しい Cloudflare を主戦場に / 新しいものはまず触る / 流行では入れない' },
    { k: 'Currently', v: 'AIChatClip 運用 + デザイン事務所（2026 夏退職予定 / 9 月以降入社可能）' },
];

export const AboutLayer = ({ progress }: Props) => {
    // セクション 4 (About) は progress 0.8 中心。
    // 一度 fade in したら progress が増えても消えないように出し切りで止める
    // (上 scroll で 0.66 を下回ると再フェード → 再進入で再発火)。
    const opacity = useTransform(progress, [0.66, 0.76], [0, 1]);
    const yOffset = useTransform(progress, [0.66, 0.8], [40, 0]);
    // backdrop-filter は見えていない区間で none にして合成コストを抑える。
    const cardBackdrop = useTransform(opacity, (o) =>
        o > 0.05 ? 'blur(24px)' : 'none',
    );

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(92vw,920px)] pointer-events-auto"
        >
            <motion.div
                style={{ backdropFilter: cardBackdrop, WebkitBackdropFilter: cardBackdrop }}
                className="border border-foreground/15 bg-background/70 px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]"
            >
                <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">
                        + PROFILE / 04
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                        Shogo Toyoshima · 26
                    </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1.05] mb-4">
                    Product を最後まで出荷する。
                    <br />
                    設計から運用まで 1 人で完結する Product Engineer。
                </h2>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl mb-6">
                    個人開発 SaaS<strong className="text-foreground">「AIChatClip」</strong>を Cloudflare スタックで運用中。Chrome / Firefox 拡張・Web・API・Obsidian Plugin のマルチサーフェスを 1 人で出荷し、有料ユーザーも獲得しています。経営学部とデザインの経験を、プロダクトの判断軸に持ち込むタイプ。
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-6 gap-y-3 text-sm mb-8">
                    {facts.map((row) => (
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
                        href="/about"
                        className="group inline-flex items-center gap-2 px-5 h-10 bg-foreground text-background font-mono text-[10px] tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Read Full About
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
                        href="https://github.com/tohshima115"
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                        GitHub ↗
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
};
