import { useRef } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { CountUp } from '../primitives/CountUp';
import { SplitChars } from '../primitives/SplitChars';
import { GridLayer } from '../visuals/GridLayer';
import { SectionFrame } from '../visuals/SectionFrame';
import { useScrollScene } from '../hooks/useScrollScene';
import { useReducedMotion } from '../hooks/useReducedMotion';

// AIChatClip pin part. docs/career/projects/aichatclip.md + profile.md より:
// - 巨大見出し: AI チャットを Obsidian に / 自動同期する SaaS。
// - 数字: 27 Free / 1 Paid / 4 Surfaces
// - スタック: Workers / D1 / Durable Objects / Workers AI / WXT / Hono
// - CTA: Open Case Study (内部) + Visit Site ↗ (外部)

const STACK_CHIPS = [
    'Workers',
    'D1',
    'Durable Objects',
    'Workers AI',
    'WXT',
    'Hono',
];

export const WorksFlagshipPart: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const idLabel = container.querySelector('[data-flagship-id]');
            const heading = container.querySelectorAll(
                '[data-flagship-heading] [data-split-chars][data-anim] > span',
            );
            const numbers = container.querySelectorAll('[data-flagship-number]');
            const chips = container.querySelectorAll('[data-flagship-chip]');
            const cta = container.querySelector('[data-flagship-cta]');
            const bottomBar = container.querySelector('[data-flagship-bottom-bar]');
            const pinTarget =
                container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: '+=220%',
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.8,
                    invalidateOnRefresh: true,
                },
            });

            tl.to(idLabel, { opacity: 1, y: 0, duration: 0.3 }, 0);
            tl.to(
                heading,
                {
                    opacity: 1,
                    yPercent: 0,
                    stagger: 0.02,
                    duration: 0.5,
                    ease: 'power3.out',
                },
                0.15,
            );
            tl.to(
                numbers,
                {
                    opacity: 1,
                    x: 0,
                    stagger: 0.12,
                    duration: 0.5,
                    ease: 'power2.out',
                },
                0.45,
            );
            tl.to(
                chips,
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.05,
                    duration: 0.4,
                    ease: 'power2.out',
                },
                0.7,
            );
            tl.to(
                cta,
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
                0.9,
            );
            if (bottomBar) {
                tl.fromTo(
                    bottomBar,
                    { scaleX: 0 },
                    { scaleX: 1, duration: 0.4, ease: 'none' },
                    0.95,
                );
            }
        },
    });

    return (
        <section
            ref={containerRef}
            data-section="works"
            className="relative w-full"
            style={{ minHeight: reduced ? '120vh' : '320vh' }}
        >
            <div
                data-pin-inner
                className="relative w-full h-screen overflow-hidden bg-background flex items-center"
            >
                <GridLayer size={48} opacity={0.04} />
                <SectionFrame inset={32} />

                {/* 背景: 対角ストライプの薄い装飾 */}
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(135deg, var(--color-foreground) 0 1px, transparent 1px 24px)',
                    }}
                />

                {/* corner label */}
                <div
                    data-flagship-id
                    data-reveal
                    className="absolute top-6 left-6 md:top-8 md:left-12 flex items-center gap-4"
                >
                    <CornerLabel label="FLAGSHIP" id="01" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60">
                        2026.01 — Ongoing
                    </span>
                </div>

                {/* 右端: 縦ラベル */}
                <div
                    aria-hidden
                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40"
                    style={{ writingMode: 'vertical-rl' }}
                >
                    SECTION 02 / WORKS
                </div>

                <div className="relative z-10 max-w-6xl w-full mx-auto px-6 md:px-12 pt-24 md:pt-32 pb-20">
                    {/* 巨大見出し */}
                    <h2
                        data-flagship-heading
                        className="font-sans font-bold text-foreground text-[clamp(2rem,5.5vw,4.5rem)] leading-[1.05] tracking-tight"
                    >
                        <SplitChars
                            text="AI チャットを Obsidian に"
                            className="block overflow-hidden"
                            dataAnim
                        />
                        <SplitChars
                            text="自動同期する SaaS。"
                            className="block overflow-hidden mt-2 text-foreground/85"
                            dataAnim
                        />
                    </h2>

                    {/* AIChatClip 名 + 数字パネル */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* number cell 1: Free */}
                        <NumberCell
                            value={27}
                            unit=""
                            label="Free Users"
                            sub="/ week + 7"
                        />
                        {/* number cell 2: Paid */}
                        <NumberCell
                            value={1}
                            unit=""
                            label="Paid User"
                            sub="Stripe / 1,000 JPY"
                        />
                        {/* number cell 3: Surfaces */}
                        <NumberCell
                            value={4}
                            unit=""
                            label="Surfaces"
                            sub="Chrome · Firefox · Web · Obsidian"
                        />
                    </div>

                    {/* スタックチップ */}
                    <div className="mt-12 flex flex-wrap gap-2">
                        {STACK_CHIPS.map((chip) => (
                            <span
                                key={chip}
                                data-flagship-chip
                                data-reveal
                                className="relative font-mono text-[11px] uppercase tracking-[0.2em] px-3 py-2 border border-foreground/15 text-foreground/80"
                            >
                                <CornerTick />
                                {chip}
                            </span>
                        ))}
                    </div>

                    {/* CTA */}
                    <div
                        data-flagship-cta
                        data-reveal
                        className="mt-12 flex flex-wrap gap-4 items-center font-mono text-xs uppercase tracking-[0.3em]"
                    >
                        <a
                            href="/projects/aichatclip"
                            className="inline-flex items-center gap-3 px-5 py-3 border border-foreground/30 text-foreground hover:border-accent hover:text-accent transition-colors"
                        >
                            <span className="text-accent">+</span>
                            <span>Open Case Study</span>
                            <span aria-hidden>→</span>
                        </a>
                        <a
                            href="https://aichatclip.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-5 py-3 text-foreground/70 hover:text-accent transition-colors"
                        >
                            <span>Visit Site</span>
                            <span aria-hidden>↗</span>
                        </a>
                    </div>
                </div>

                {/* 下端 accent bar */}
                <div
                    aria-hidden
                    data-flagship-bottom-bar
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent origin-left"
                    style={{ transform: 'scaleX(0)' }}
                />
            </div>
        </section>
    );
};

interface NumberCellProps {
    value: number;
    unit: string;
    label: string;
    sub: string;
}

const NumberCell: React.FC<NumberCellProps> = ({ value, unit, label, sub }) => {
    return (
        <div
            data-flagship-number
            data-reveal-x
            className="relative pl-4 border-l-2 border-accent/60"
        >
            <span className="absolute left-0 top-1 bottom-1 w-px bg-foreground/10" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                {label}
            </span>
            <span className="font-sans font-bold text-foreground text-[clamp(2.5rem,5vw,4rem)] leading-none tabular-nums">
                <CountUp to={value} duration={1100} />
                {unit && (
                    <span className="ml-1 text-foreground/50 text-[0.5em]">
                        {unit}
                    </span>
                )}
            </span>
            <span className="block mt-3 font-mono text-[11px] tracking-[0.15em] text-muted-foreground/80">
                {sub}
            </span>
        </div>
    );
};

const CornerTick: React.FC = () => (
    <>
        <span
            aria-hidden
            className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-accent"
        />
        <span
            aria-hidden
            className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-accent"
        />
    </>
);
