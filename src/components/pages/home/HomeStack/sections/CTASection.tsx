import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ScanLines } from '../visuals/ScanLines';
import { SectionFrame } from '../visuals/SectionFrame';
import { useReducedMotion } from '../hooks/useReducedMotion';

const RINGS = [1200, 900, 600, 360];

export const CTASection: React.FC = () => {
    const ref = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();
    const inView = useInView(ref, { once: true, amount: 0.4 });

    return (
        <section
            ref={ref}
            data-section="cta"
            className="relative w-full bg-background overflow-hidden"
        >
            <div className="relative w-full min-h-screen flex items-center justify-center py-32">
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

                {/* 上端から下に伸びる細線 */}
                <motion.span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-px bg-accent origin-top"
                    initial={reduced ? { scaleY: 1 } : { scaleY: 0 }}
                    animate={inView || reduced ? { scaleY: 1 } : { scaleY: 0 }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 0.05 }}
                    style={{ height: '40vh' }}
                />

                <ScanLines opacity={0.03} />

                <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">

                    <motion.h2
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 16 }
                        }
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="font-sans font-bold text-foreground text-[clamp(1.5rem,3.6vw,2.5rem)] leading-[1.4] tracking-tight max-w-lg mx-auto"
                    >
                        お仕事の話でも、ちょっと雑談したいでも、遊びのお誘いでも。
                        <br />
                        何かあれば、気軽にコンタクトまで。
                    </motion.h2>

                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 16 }
                        }
                        transition={{ duration: 0.7, delay: 0.65 }}
                        className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs uppercase tracking-[0.3em]"
                    >
                        <a
                            href="/contact"
                            className="inline-flex items-center gap-3 px-7 py-4 bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <span>+</span>
                            <span>Contact</span>
                            <span aria-hidden>→</span>
                        </a>
                        <a
                            href="/about"
                            className="inline-flex items-center gap-3 px-7 py-4 border border-foreground/30 text-foreground hover:border-accent hover:text-accent transition-colors"
                        >
                            <span>About</span>
                            <span aria-hidden>→</span>
                        </a>
                    </motion.div>

                    <motion.div
                        initial={reduced ? false : { opacity: 0 }}
                        animate={inView || reduced ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                        className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs tracking-[0.2em] text-muted-foreground"
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
