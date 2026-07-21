import React, { useState } from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * About の「経歴」と、Works / Blog への導線。
 *
 * 経歴はページの背骨に据え、Works 一覧の「押すと育つパネル」と同じ
 * 操作語彙 (その場で展開) に置き換えている。折りたたみ時も 時期 / 所属 が
 * 常に見えるので一覧として読め、クリックで詳細がその場に開く。
 */

const EASE = [0.22, 1, 0.36, 1] as const;

interface Entry {
    period: string;
    org: string;
    /** 現在進行中。ドットをアンバーで強調する */
    now?: boolean;
    body: string;
}

// 経歴データ。編集はここで完結する (スキーマ化はしていない)。
const TIMELINE: Entry[] = [
    {
        period: '2026.01 — 現在',
        org: '個人開発 / AIChatClip',
        now: true,
        body: 'AI チャットの会話をクリップしたくて作りました。企画・設計・UI・実装・運用・マーケまで一人で回しています。Chrome / Firefox 拡張と Web + API の SaaS として公開中です。',
    },
    {
        period: '2025.07 — 現在',
        org: 'Web制作会社',
        now: true,
        body: 'デザインと実装のクライアントワークを担当。最初はデザインだけでしたが、自分の設計を自分で実装した方が速いと気づいてから、環境の構成ごと引き受けるようになりました。',
    },
    {
        period: '2024 — 2026.01',
        org: '社会起業チーム / Swept',
        body: '3人チームにデザイナーとして参加。以前のチームで実装が止まるのを見て「自分で書けた方がいい」と独学を始め、その延長でデザインから実装まで一人で担うように。方向性の違いから 2026 年 1 月に離脱しました。',
    },
    {
        period: '〜 2023',
        org: '東京理科大学 経営学部',
        body: '統計学専攻。授業よりも囲碁部の活動に力を入れていた記憶の方が強いです。ここで身につけた「制約の中で法則を探す」感覚は、いまの設計にも効いています。',
    },
];

export const AboutJourney: React.FC = () => {
    return (
        <MotionConfig reducedMotion="user">
            <CareerPath />
            <ExploreMore />
        </MotionConfig>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 経歴タイムライン
// ─────────────────────────────────────────────────────────────────────────────

const CareerPath: React.FC = () => {
    // 既定で現在 (先頭) を開いておき、展開できることを一目で伝える
    const [open, setOpen] = useState<number | null>(0);
    const reduce = useReducedMotion();

    // 読み込み時: 背骨が上から伸び、ドットが順にポップ、行が左からフェード。
    // variant 伝播は「親に可視プロパティが無い」構成で不安定なため直接指定する。
    const enter = (delay: number) =>
        reduce
            ? { initial: false as const }
            : { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.45, ease: EASE, delay } };

    return (
        <section className="mb-20">
            <SectionHead title="これまでの流れ" />

            <ol className="relative mt-8 max-w-3xl">
                {/* 背骨。読み込み時に上から伸びる。ドット (w-[18px], left-0 起点) の
                    中心 (x=9px) に対して、線自身の幅ぶん (0.5px) を transform で
                    追加補正しないと右に寄って見える */}
                <motion.span
                    aria-hidden
                    initial={reduce ? false : { scaleY: 0 }}
                    animate={reduce ? undefined : { scaleY: 1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    style={{ originY: 0 }}
                    className="absolute left-[9px] top-2 bottom-2 w-px -translate-x-1/2 bg-foreground/15"
                />

                {TIMELINE.map((entry, i) => {
                    const isOpen = open === i;
                    return (
                        <motion.li key={entry.org} {...enter(0.08 + i * 0.09)} className="relative pb-1 pl-9">
                            {/* ドット: 現在=アンバー / 過去=グレー。過去側は半透明色だと背骨の線が
                                透けて見えるので、線と重なっても透けない不透明な色にしている */}
                            <motion.span
                                aria-hidden
                                initial={reduce ? false : { scale: 0 }}
                                animate={reduce ? undefined : { scale: 1 }}
                                transition={{ type: 'spring', stiffness: 480, damping: 20, delay: 0.12 + i * 0.09 }}
                                className={`absolute left-0 top-[7px] h-[18px] w-[18px] rounded-full border-4 border-background ${
                                    entry.now
                                        ? 'bg-accent'
                                        : 'bg-[color-mix(in_oklab,var(--color-foreground)_25%,var(--color-background))]'
                                }`}
                            />

                            <button
                                type="button"
                                onClick={() => setOpen(isOpen ? null : i)}
                                aria-expanded={isOpen}
                                aria-controls={`career-body-${i}`}
                                className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                                        {entry.period}
                                    </span>
                                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                        <span className="font-sans text-base font-bold tracking-tight text-foreground md:text-lg">
                                            {entry.org}
                                        </span>
                                    </span>
                                </span>

                                <ChevronDown
                                    size={18}
                                    strokeWidth={1.75}
                                    aria-hidden
                                    className={`mt-1 shrink-0 text-muted-foreground transition-all duration-300 group-hover:text-foreground ${
                                        isOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        id={`career-body-${i}`}
                                        key="body"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: reduce ? 0 : 0.32, ease: EASE }}
                                        className="overflow-hidden"
                                    >
                                        <p className="px-3 pb-4 pt-1 text-sm leading-relaxed text-muted-foreground md:max-w-2xl">
                                            {entry.body}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.li>
                    );
                })}
            </ol>
        </section>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// もっと知りたい人へ (旧 素顔) — Works / Blog への導線に置き換え
// ─────────────────────────────────────────────────────────────────────────────

const ExploreMore: React.FC = () => (
    <section className="mb-16">
        <SectionHead title="もっと知りたい人へ" />

        <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
            <a
                href="/works"
                className="group flex flex-col gap-2 rounded-2xl border border-foreground/12 p-5 transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
                <span className="font-mono text-2xs uppercase tracking-[0.2em] text-muted-foreground">Works</span>
                <span className="font-sans text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
                    これまで作ったもの
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                    僕が関わってきたものです。
                </span>
            </a>

            <a
                href="/blog"
                className="group flex flex-col gap-2 rounded-2xl border border-foreground/12 p-5 transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
                <span className="font-mono text-2xs uppercase tracking-[0.2em] text-muted-foreground">Blog</span>
                <span className="font-sans text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
                    もっと深掘りたい人はこちら
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                    ポエムに近いブログです。
                </span>
            </a>
        </div>
    </section>
);

// ─────────────────────────────────────────────────────────────────────────────

const SectionHead: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="border-l-4 border-accent pl-4 text-2xl font-bold tracking-tight md:text-3xl">
        {title}
    </h2>
);

export default AboutJourney;
