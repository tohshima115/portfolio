import { useEffect, useRef, useState } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { ScrambleText } from '../primitives/ScrambleText';
import { SplitChars } from '../primitives/SplitChars';
import { GridLayer } from '../visuals/GridLayer';
import { ScanLines } from '../visuals/ScanLines';
import { SectionFrame } from '../visuals/SectionFrame';
import { useScrollScene } from '../hooks/useScrollScene';
import { useReducedMotion } from '../hooks/useReducedMotion';

// docs/career/about-copywriting.md §12.1 (Round 2 確定稿) を反映。
// pin: 約 120vh 滞留して L1 SplitChars 落下 → L2 ScrambleText → 本文 reveal → CTA。
// 走査線 / コーナーマーカー / 縦ラベル / 座標表示 で SF 工業の最低限を組む。

const Clock: React.FC = () => {
    const [time, setTime] = useState('--:--');
    useEffect(() => {
        const tick = () => {
            const d = new Date();
            const mm = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            setTime(`${mm}:${ss}`);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, []);
    return <span aria-hidden="true">{time}</span>;
};

export const StatementSection: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();
    const [scrambleArmed, setScrambleArmed] = useState(false);

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const l1Chars = container.querySelectorAll(
                '[data-statement-h1] [data-split-chars][data-anim] > span',
            );
            const body = container.querySelector('[data-statement-body]');
            const cta = container.querySelector('[data-statement-cta]');
            const overlay = container.querySelector(
                '[data-statement-scanlines-end]',
            );
            const progressBar = container.querySelector(
                '[data-statement-progress]',
            );
            const pinTarget = container.querySelector<HTMLElement>(
                '[data-pin-inner]',
            );
            if (!pinTarget) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: '+=120%',
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.6,
                    invalidateOnRefresh: true,
                    onUpdate: (st) => {
                        // L2 ScrambleText を progress 0.20 で 1 度だけアーム
                        if (st.progress > 0.18 && !scrambleArmed) {
                            setScrambleArmed(true);
                        }
                    },
                },
            });

            tl.to(
                l1Chars,
                {
                    opacity: 1,
                    yPercent: 0,
                    stagger: 0.025,
                    duration: 0.5,
                    ease: 'power3.out',
                },
                0,
            );

            tl.to(
                body,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: 'power2.out',
                },
                0.55,
            );

            tl.to(
                cta,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                },
                0.85,
            );

            if (overlay) {
                tl.fromTo(
                    overlay,
                    { opacity: 0 },
                    { opacity: 0.08, duration: 0.3 },
                    1.0,
                );
            }

            if (progressBar) {
                tl.fromTo(
                    progressBar,
                    { scaleX: 0 },
                    { scaleX: 1, duration: 1.4, ease: 'none' },
                    0,
                );
            }
        },
    });

    return (
        <section
            ref={containerRef}
            data-section="statement"
            className="relative w-full"
            style={{ minHeight: reduced ? '100vh' : '120vh' }}
        >
            <div
                data-pin-inner
                className="relative w-full h-screen overflow-hidden bg-background flex items-center justify-center"
            >
                <GridLayer size={32} opacity={0.05} fade />
                <SectionFrame inset={32} />

                {/* 上端 progress bar (accent) */}
                <div
                    aria-hidden
                    data-statement-progress
                    className="absolute top-0 left-0 right-0 h-px bg-accent origin-left"
                    style={{ transform: 'scaleX(0)' }}
                />

                {/* 左上: corner label */}
                <div className="absolute top-6 left-6 md:top-8 md:left-12">
                    <CornerLabel label="STATEMENT" id="01" />
                </div>

                {/* 右上: 年月 + 時計 */}
                <div className="absolute top-6 right-16 md:top-8 md:right-24 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3">
                    <span>2026.05</span>
                    <span className="text-muted-foreground/60">/</span>
                    <Clock />
                </div>

                {/* 右端中央: 縦ラベル (md+) */}
                <div
                    aria-hidden
                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40"
                    style={{ writingMode: 'vertical-rl' }}
                >
                    SECTION 01 / STATEMENT
                </div>

                {/* 左下: 座標 */}
                <div className="absolute bottom-6 left-6 md:bottom-8 md:left-12 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">
                    LAT 35.6762  LON 139.6503
                </div>

                {/* 中央コンテンツ */}
                <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 w-full">
                    <h2
                        data-statement-h1
                        className="font-sans font-bold text-foreground text-[clamp(1.75rem,4.5vw,3.75rem)] leading-[1.15] tracking-tight"
                    >
                        <SplitChars
                            text="Product を最後まで出荷する。"
                            className="block overflow-hidden"
                            dataAnim
                        />
                        <span className="block overflow-hidden mt-3 text-foreground/85">
                            <ScrambleText
                                text="設計から運用まで 1 人で完結する Product Engineer。"
                                play={scrambleArmed}
                                duration={500}
                                perCharStagger={14}
                            />
                        </span>
                    </h2>

                    <div
                        data-statement-body
                        data-reveal
                        className="mt-10 max-w-2xl text-foreground/80 leading-loose text-sm md:text-base"
                    >
                        <p>
                            個人開発 SaaS「AIChatClip」を Cloudflare スタックで運用中。
                            Chrome / Firefox 拡張・Web・API・Obsidian Plugin の
                            マルチサーフェスを 1 人で出荷し、有料ユーザーも獲得しています。
                            経営学部とデザインの経験を、プロダクトの判断軸に持ち込むタイプ。
                        </p>
                    </div>

                    <div
                        data-statement-cta
                        data-reveal
                        className="mt-10"
                    >
                        <a
                            href="/about"
                            className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-foreground hover:text-accent transition-colors"
                        >
                            <span className="text-accent">+</span>
                            <span>Read Statement</span>
                            <span aria-hidden>→</span>
                        </a>
                    </div>
                </div>

                {/* 末尾 ScanLines (pin progress 1.0 でうっすら現れる) */}
                <div
                    data-statement-scanlines-end
                    className="absolute inset-0 pointer-events-none"
                    style={{ opacity: 0 }}
                >
                    <ScanLines opacity={1} lineSize={4} />
                </div>
            </div>
        </section>
    );
};
