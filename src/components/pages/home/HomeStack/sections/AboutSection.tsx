import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { GridLayer } from '../visuals/GridLayer';
import { SectionFrame } from '../visuals/SectionFrame';
import { useReducedMotion } from '../hooks/useReducedMotion';

// docs/career/profile.md + about-copywriting.md §12.1 facts より:
// - Background timeline (経営学部 → 起業準備 → デザイン → 個人開発)
// - Stack: Frontend / Edge & Backend
// - Currently: 2026 夏退職 / 9 月以降入社可能

interface TimelineRow {
    year: string;
    title: string;
    detail?: string;
    highlight?: boolean;
}

const TIMELINE: TimelineRow[] = [
    { year: '〜2022', title: '東京理科大学 経営学部卒', detail: '23歳卒業 / PL・事業構造の基礎' },
    { year: '2022 — 2024', title: '起業準備 (Swept)', detail: '友人 2 人と 2〜3 年。リーン / ユーザーインタビューを実装' },
    { year: '2025.07 —', title: 'デザイン事務所', detail: 'Web デザイン → 業務改善 → プロダクト開発へ重心移動' },
    { year: '2026.01 —', title: 'AIChatClip 開発開始', detail: 'Cloudflare スタックでマルチサーフェス出荷', highlight: true },
];

const STACK_FRONTEND = [
    'TypeScript',
    'React 19',
    'React Router v7',
    'Astro 5',
    'Tailwind v4',
];
const STACK_EDGE = [
    'Cloudflare Workers',
    'D1',
    'Durable Objects',
    'Workers AI',
    'Zero Trust',
    'Hono',
    'WXT',
];

export const AboutSection: React.FC = () => {
    return (
        <section
            data-section="about"
            className="relative w-full bg-background"
        >
            <div className="relative w-full min-h-screen py-24 md:py-32">
                <GridLayer size={32} opacity={0.04} />
                <SectionFrame inset={32} />

                <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
                    {/* 名前 / 写真 / 縦書き BIO は WorksSection の pin 内 BioIntroStage で見せ済み。
                        ここでは Timeline + Stack だけに絞る。 */}
                    <h3 className="mt-16 font-mono text-2xs uppercase tracking-[0.4em] text-muted-foreground mb-6 flex items-center gap-3">
                        <span className="text-accent">+</span>
                        <span>TIMELINE</span>
                        <span className="flex-1 h-px bg-foreground/10" />
                    </h3>

                    <ol className="relative pl-6 border-l border-foreground/15">
                        {TIMELINE.map((row, i) => (
                            <TimelineItem key={i} row={row} index={i} />
                        ))}
                    </ol>

                    <h3 className="mt-20 font-mono text-2xs uppercase tracking-[0.4em] text-muted-foreground mb-6 flex items-center gap-3">
                        <span className="text-accent">+</span>
                        <span>STACK</span>
                        <span className="flex-1 h-px bg-foreground/10" />
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <StackBlock label="Frontend" items={STACK_FRONTEND} />
                        <StackBlock label="Edge & Backend" items={STACK_EDGE} />
                    </div>

                    <div className="mt-16">
                        <a
                            href="/about"
                            className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-foreground hover:text-accent transition-colors"
                        >
                            <span className="text-accent">+</span>
                            <span>Read Full About</span>
                            <span aria-hidden>→</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

const TimelineItem: React.FC<{ row: TimelineRow; index: number }> = ({
    row,
    index,
}) => {
    const ref = useRef<HTMLLIElement>(null);
    const reduced = useReducedMotion();
    const inView = useInView(ref, { once: true, amount: 0.4, margin: '-12% 0px' });
    return (
        <motion.li
            ref={ref}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={
                inView || reduced
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -8 }
            }
            transition={{
                duration: 0.45,
                delay: reduced ? 0 : index * 0.04,
                ease: [0.22, 1, 0.36, 1],
            }}
            className="relative pb-8 last:pb-0"
        >
            <span
                aria-hidden
                className={`absolute -left-[27px] top-1.5 w-2 h-2 ${
                    row.highlight ? 'bg-accent' : 'bg-foreground/40'
                }`}
            />
            <div className="flex items-baseline gap-3 mb-1">
                <span
                    className={`font-mono text-xs uppercase tracking-[0.25em] tabular-nums ${
                        row.highlight ? 'text-accent' : 'text-muted-foreground'
                    }`}
                >
                    {row.year}
                </span>
            </div>
            <p
                className={`font-sans font-medium leading-snug ${
                    row.highlight
                        ? 'text-foreground text-base md:text-lg'
                        : 'text-foreground/90 text-sm md:text-base'
                }`}
            >
                {row.title}
            </p>
            {row.detail && (
                <p className="mt-1 text-foreground/55 text-sm leading-relaxed">
                    {row.detail}
                </p>
            )}
        </motion.li>
    );
};

const StackBlock: React.FC<{ label: string; items: string[] }> = ({
    label,
    items,
}) => (
    <div>
        <span className="font-mono text-2xs uppercase tracking-[0.3em] text-muted-foreground/80 block mb-4 border-l border-accent pl-3">
            {label}
        </span>
        <ul className="space-y-1.5 font-mono text-sm text-foreground/85">
            {items.map((it) => (
                <li key={it} className="flex items-center gap-2">
                    <span className="text-accent text-2xs">▸</span>
                    <span>{it}</span>
                </li>
            ))}
        </ul>
    </div>
);
