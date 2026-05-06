import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { CornerLabel } from '../primitives/CornerLabel';
import { ScrambleText } from '../primitives/ScrambleText';
import { GridLayer } from '../visuals/GridLayer';
import { ScanLines } from '../visuals/ScanLines';
import { SectionFrame } from '../visuals/SectionFrame';
import { useReducedMotion } from '../hooks/useReducedMotion';

// docs/career/profile.md より退職時期 / 入社可能時期 + about-copywriting.md スタンス。
// 同心円 SVG + ScrambleText で「最後の合図」演出。

const RINGS = [1200, 900, 600, 360];

export const CTASection: React.FC = () => {
    const ref = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();
    const inView = useInView(ref, { once: true, amount: 0.4 });
    const [scrambleOn, setScrambleOn] = useState(false);

    useEffect(() => {
        if (!inView) return;
        // 入場後 200ms ほど待ってから ScrambleText を始動 (リング fade と被らせない)
        const t = window.setTimeout(() => setScrambleOn(true), 220);
        return () => window.clearTimeout(t);
    }, [inView]);

    return (
        <section
            ref={ref}
            data-section="cta"
            className="relative w-full bg-background overflow-hidden"
        >
            <div className="relative w-full min-h-screen flex items-center justify-center py-32">
                <GridLayer size={32} opacity={0.04} />
                <SectionFrame inset={32} />

                {/* 同心円 SVG */}
                <div
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <svg
                        width="1280"
                        height="1280"
                        viewBox="-640 -640 1280 1280"
                        className="max-w-none"
                    >
                        {RINGS.map((r, i) => (
                            <motion.circle
                                key={r}
                                cx="0"
                                cy="0"
                                r={r}
                                fill="none"
                                stroke="var(--color-accent)"
                                strokeWidth="1"
                                strokeOpacity="0.08"
                                initial={reduced ? { opacity: 1 } : { opacity: 0 }}
                                animate={
                                    inView || reduced
                                        ? { opacity: 1 }
                                        : { opacity: 0 }
                                }
                                transition={{
                                    duration: 1.2,
                                    delay: reduced ? 0 : 0.1 + i * 0.12,
                                    ease: 'easeOut',
                                }}
                                style={{
                                    animation: reduced
                                        ? undefined
                                        : `pulse-ring ${4 + i * 0.6}s ease-in-out infinite`,
                                    animationDelay: `${i * 0.4}s`,
                                }}
                            />
                        ))}
                    </svg>
                </div>

                {/* 上端から下に伸びる細線 (中央に集まる演出) */}
                <motion.span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-px bg-accent origin-top"
                    initial={reduced ? { scaleY: 1 } : { scaleY: 0 }}
                    animate={inView || reduced ? { scaleY: 1 } : { scaleY: 0 }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 0.05 }}
                    style={{ height: '40vh' }}
                />

                <ScanLines opacity={0.03} />

                {/* corner */}
                <div className="absolute top-6 left-6 md:top-8 md:left-12">
                    <CornerLabel label="CTA / OPEN CHANNEL" id="04" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
                    <motion.p
                        initial={reduced ? false : { opacity: 0, y: 12 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 12 }
                        }
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-8"
                    >
                        STATUS · NOW HIRING / FOR PRODUCT ENGINEER ROLE
                    </motion.p>

                    <h2 className="font-sans font-bold text-foreground text-[clamp(2rem,5vw,4rem)] leading-[1.15] tracking-tight">
                        <motion.span
                            initial={reduced ? false : { opacity: 0, y: 16 }}
                            animate={
                                inView || reduced
                                    ? { opacity: 1, y: 0 }
                                    : { opacity: 0, y: 16 }
                            }
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="block"
                        >
                            <span>2026 年 </span>
                            <span className="text-accent">
                                <ScrambleText
                                    text="7〜8"
                                    play={scrambleOn}
                                    duration={500}
                                    perCharStagger={20}
                                />
                            </span>
                            <span> 月退職予定。</span>
                        </motion.span>
                        <motion.span
                            initial={reduced ? false : { opacity: 0, y: 16 }}
                            animate={
                                inView || reduced
                                    ? { opacity: 1, y: 0 }
                                    : { opacity: 0, y: 16 }
                            }
                            transition={{ duration: 0.7, delay: 0.35 }}
                            className="block mt-3 text-foreground/85"
                        >
                            <span className="text-accent">
                                <ScrambleText
                                    text="9"
                                    play={scrambleOn}
                                    duration={500}
                                    perCharStagger={20}
                                />
                            </span>
                            <span> 月以降の入社が可能です。</span>
                        </motion.span>
                    </h2>

                    <motion.p
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 16 }
                        }
                        transition={{ duration: 0.7, delay: 0.55 }}
                        className="mt-10 max-w-xl mx-auto text-foreground/70 leading-relaxed text-sm md:text-base"
                    >
                        プロダクトエンジニア / コーポレートエンジニアの枠でお話できる方、カジュアル面談を歓迎します。
                        Cloudflare に強い会社・受託 + 自社プロダクトの会社からの打診も歓迎です。
                    </motion.p>

                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 16 }
                        }
                        transition={{ duration: 0.7, delay: 0.7 }}
                        className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs uppercase tracking-[0.3em]"
                    >
                        <a
                            href="/contact"
                            className="inline-flex items-center gap-3 px-7 py-4 bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <span>+</span>
                            <span>Open Channel</span>
                            <span aria-hidden>→</span>
                        </a>
                        <a
                            href="/about"
                            className="inline-flex items-center gap-3 px-7 py-4 border border-foreground/30 text-foreground hover:border-accent hover:text-accent transition-colors"
                        >
                            <span>About / Profile</span>
                            <span aria-hidden>→</span>
                        </a>
                    </motion.div>

                    <motion.div
                        initial={reduced ? false : { opacity: 0 }}
                        animate={inView || reduced ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.95 }}
                        className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.2em] text-muted-foreground"
                    >
                        <a
                            href="https://github.com/tohshima115"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                        >
                            GITHUB ↗
                        </a>
                        <span className="text-muted-foreground/30">/</span>
                        <a
                            href="https://x.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                        >
                            X ↗
                        </a>
                        <span className="text-muted-foreground/30">/</span>
                        <a
                            href="mailto:tohshima115@gmail.com"
                            className="hover:text-foreground transition-colors"
                        >
                            EMAIL
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
