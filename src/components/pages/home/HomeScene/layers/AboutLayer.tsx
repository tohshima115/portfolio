import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

const facts = [
    { k: 'Background', v: '東京理科大学 経営学部卒 / 元デザイナー' },
    { k: 'Stack', v: 'Cloudflare 主戦場 · TypeScript · React Router v7 · Astro · Hono' },
    { k: 'Stance', v: 'Cloudflare を使い倒す · まず触る · 流行で入れない' },
    { k: 'Currently', v: 'AIChatClip 個人開発 + デザイン事務所バイト（退職予定）' },
];

export const AboutLayer = ({ progress }: Props) => {
    // セクション 4 (About) は progress 0.8 中心。
    const opacity = useTransform(progress, [0.66, 0.76, 0.86, 0.93], [0, 1, 1, 0]);
    const yOffset = useTransform(progress, [0.66, 0.8, 0.93], [40, 0, -40]);

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(92vw,920px)] pointer-events-auto"
        >
            <div className="border border-foreground/15 bg-background/70 backdrop-blur-xl px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
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
                    Find → Solve → Use の
                    <br />
                    サイクルで動く Product Engineer。
                </h2>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl mb-6">
                    経営学部出身、デザイナー起点で実装まで自走。<strong className="text-foreground">レンジが広く実行力がある、ただし個々の技術の深さはこれから</strong>が正確な自己像。9 割理詰め + 1 割感覚で意思決定。プロダクトを 1 人で出荷する立ち位置で、AI を「自分が判断したことの実装速度を上げる道具」として使う。
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
            </div>
        </motion.div>
    );
};
