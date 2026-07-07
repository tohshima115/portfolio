import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { SectionFrame } from '../visuals/SectionFrame';
import { useReducedMotion } from '../hooks/useReducedMotion';

// docs/career/profile.md + about-copywriting.md §12.1 facts より:
// - Background timeline (東京理科大学卒 → 起業準備 → Web制作会社) を簡潔に。
//   学歴は年齢の目安として年だけ書ければ十分、詳細は不要。
// - Stack は StackHeroSection で既出のためここでは重複させない。
// - このセクションは pin しない。通常スクロールでそのまま読めれば十分。

interface TimelineRow {
    year: string;
    title: string;
    detail?: string;
    highlight?: boolean;
}

const TIMELINE: TimelineRow[] = [
    { year: '2023', title: '東京理科大学 経営学部卒' },
    {
        year: '2024 — 2026',
        title: '起業準備',
        detail: '3人チームで社会起業に挑戦、デザインから実装まで担当',
    },
    {
        year: '2025.07 —',
        title: 'Web制作会社',
        detail: 'Webデザイン〜実装、業務改善ツールの内製も並行',
        highlight: true,
    },
];

export const AboutSection: React.FC = () => {
    return (
        <section
            data-section="about"
            className="relative w-full bg-background"
        >
            <div className="relative w-full py-20 md:py-28">
                <SectionFrame inset={32} />

                <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-12 md:mb-16">
                        <span className="block font-sans font-black uppercase tracking-tight text-foreground/90 text-[clamp(1.75rem,9svh,3.5rem)] md:text-[clamp(2.5rem,7vw,5.5rem)] leading-none">
                            About
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-16">
                        {/* 顔写真枠: 実写を差し込むまでの placeholder */}
                        <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden border border-foreground/15 bg-foreground/[0.03] flex items-center justify-center shrink-0">
                            <span className="font-mono text-3xs uppercase tracking-[0.3em] text-muted-foreground/40">
                                Photo
                            </span>
                        </div>

                        <div className="w-full max-w-sm md:max-w-md">
                            <ol className="relative pl-6 border-l border-foreground/15">
                                {TIMELINE.map((row, i) => (
                                    <TimelineItem key={i} row={row} index={i} />
                                ))}
                            </ol>

                            <div className="mt-10">
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
