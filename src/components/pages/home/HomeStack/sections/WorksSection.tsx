import { useRef, useState, useEffect } from 'react';
import { SplitChars } from '../primitives/SplitChars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { GlobeBackground } from '../visuals/GlobeBackground';
import { PROJECTS } from './works/data';
import {
    PIN_SCROLL_END,
    SECTION_MIN_HEIGHT_VH,
    INITIAL_WAVE_COLS,
    WAVE_PROGRESS_GRID,
    WAVE_GROWBACK,
    TIMING,
    DESKTOP_GRID_CONFIG,
    MOBILE_GRID_CONFIG,
    type GridConfig,
} from './works/constants';
import { FolderGrid } from './works/FolderGrid';
import { ProjectStage } from './works/ProjectStage';

// WorksLead = 1 つの pin セクションで以下を順送り表示する:
//   Phase A (~0.05–0.30): Cloudflare hero reveal
//   Phase B (~0.30–0.62): folder grid waterfall in
//   Phase C (~0.62–0.66): 全被覆ホールド
//   Phase D (~0.66–0.86): 右シフト + 中段 shrink + hero fade
//   Phase E (~0.78–1.10): WORKS heading reveal
//   Phase F (~1.30–2.60): WORKS → Project 01 → 02 → 03 を crossfade で順送り
const WorksLead: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    // モバイル判定: SSR は false、mount 後に実際の幅で更新。
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    const config: GridConfig = isMobile ? MOBILE_GRID_CONFIG : DESKTOP_GRID_CONFIG;

    useScrollScene(containerRef, {
        disabled: reduced,
        deps: [isMobile],
        setup: ({ gsap, ScrollTrigger, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            const mobile = window.innerWidth < 768;
            const cfg: GridConfig = mobile ? MOBILE_GRID_CONFIG : DESKTOP_GRID_CONFIG;

            // ── Phase A 用 selector ──
            const globe = container.querySelector<HTMLElement>('[data-lead-globe]');
            const heroRow = container.querySelector<HTMLElement>('[data-hero-row]');
            const subLabel = container.querySelector('[data-lead-sublabel]');
            const headlineChars = container.querySelectorAll(
                '[data-lead-heading] [data-split-chars][data-anim] > span',
            );
            const statsBadge = container.querySelector('[data-lead-statbadge]');
            const stats = container.querySelectorAll('[data-lead-stat]');
            const statsCount = container.querySelector('[data-lead-statcount]');

            // ── Phase B/D 用 selector (folder grid) ──
            const tileEls = container.querySelectorAll<HTMLElement>('[data-folder-tile]');
            const midTiles = container.querySelectorAll<HTMLElement>(
                '[data-folder-tile][data-mid="1"]',
            );

            // ── Phase D/E 用 selector (hero fade + WORKS stage) ──
            const heroLayer = container.querySelector('[data-hero-layer]');
            const sublabel = container.querySelector('[data-trans-sublabel]');
            const ruleLeft = container.querySelector('[data-trans-rule="left"]');
            const ruleRight = container.querySelector('[data-trans-rule="right"]');
            const headingChars = container.querySelectorAll(
                '[data-trans-heading] [data-split-chars][data-anim] > span',
            );
            const meta = container.querySelector('[data-trans-meta]');

            // ── Phase F 用 selector (project stages) ──
            const worksStage = container.querySelector<HTMLElement>('[data-stage="works"]');
            const projectStages = container.querySelectorAll<HTMLElement>(
                '[data-stage="project"]',
            );
            const projectStage = (id: string) =>
                container.querySelector<HTMLElement>(`[data-project-id="${id}"]`);
            const projectRules = (id: string) =>
                container.querySelectorAll<HTMLElement>(
                    `[data-project-id="${id}"] [data-project-rule]`,
                );

            // ── Phase A stats 要素の初期 y オフセットをセット ──
            if (statsBadge) gsap.set(statsBadge, { y: 8 });
            if (stats.length > 0) gsap.set(stats, { y: 6 });
            if (statsCount) gsap.set(statsCount, { y: 6 });

            // ─── Phase A-pre: globe スライド + headline roll-up ───
            // globe は最初から表示済み (中央寄せ)。pin が発生する前、セクションが画面に
            // 迫ってくる自然なスクロールの間に「中央 → 右カラムの定位置」へスライドし、
            // 同時に headline が 1 文字ずつ下から巻き上がる。pin (top top) を待たず、
            // "top bottom"(セクション上端が画面下端に触れた瞬間)から "top top"
            // (pin 発生の瞬間) までの間で完結させる、独立した scrub アニメ。
            if (globe && heroRow) {
                const rowRect = heroRow.getBoundingClientRect();
                const globeRect = globe.getBoundingClientRect();
                const rowCenterX = rowRect.left + rowRect.width / 2;
                const globeCenterX = globeRect.left + globeRect.width / 2;
                const initialGlobeX = mobile ? 0 : rowCenterX - globeCenterX;

                gsap.set(globe, { x: initialGlobeX });
                gsap.set(headlineChars, { yPercent: -110, y: 0, opacity: 0 });

                gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        start: 'top bottom',
                        end: 'top top',
                        scrub: 0.4,
                    },
                })
                    .to(globe, { x: 0, duration: 1.3, ease: 'power2.out' }, 0.5)
                    .to(
                        headlineChars,
                        {
                            opacity: 1,
                            yPercent: 0,
                            y: 0,
                            stagger: 0.035,
                            duration: 0.12,
                            ease: 'power3.out',
                        },
                        1.0,
                    );
            }

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: PIN_SCROLL_END,
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.7,
                    invalidateOnRefresh: true,
                },
            });

            // ─── Phase A: Cloudflare hero reveal (globe/headline は Phase A-pre で完了済み) ───
            tl.to(subLabel, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.heroSubLabel);
            tl.to(statsBadge, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.heroStatsBadge);
            tl.to(
                stats,
                { opacity: 1, y: 0, stagger: 0.012, duration: 0.10, ease: 'power2.out' },
                TIMING.heroStats,
            );
            tl.to(statsCount, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.heroStatsCount);

            // ─── Phase B: folder grid 左から waterfall ───
            tileEls.forEach((el) => {
                gsap.set(el, { x: '-110vw', xPercent: 0, '--travel': 0 });
            });
            tileEls.forEach((el) => {
                const d = Number(el.getAttribute('data-tile-delay')) || 0;
                tl.fromTo(
                    el,
                    { x: '-110vw', xPercent: 0, '--travel': 0 },
                    {
                        x: 0,
                        xPercent: 0,
                        '--travel': 1,
                        duration: TIMING.folderWaterfallDuration,
                        ease: 'expo.out',
                    },
                    TIMING.folderWaterfallStart + d * TIMING.folderWaterfallSpread,
                );
            });

            // ─── Phase D: 中段 shrink + hero fade + 連続右シフト ───
            const TOTAL_SHIFT_COLS = 1 + TIMING.projectTransitions.length;
            tl.to(
                tileEls,
                {
                    x: `+=${TOTAL_SHIFT_COLS * cfg.tileWVw}vw`,
                    duration: TIMING.timelineEnd - TIMING.midShrinkStart,
                    ease: 'none',
                },
                TIMING.midShrinkStart,
            );

            if (mobile) {
                // モバイル: 全中段行を一括で完全消去。wave パターンは使わない。
                midTiles.forEach((el) => {
                    const stagger = Number(el.getAttribute('data-mid-delay')) || 0;
                    tl.to(
                        el,
                        {
                            scale: 0,
                            rotationX: 90,
                            duration: TIMING.midShrinkDuration,
                            ease: 'power3.out',
                        },
                        TIMING.midShrinkStart + TIMING.shiftSettleOffset + stagger,
                    );
                });
            } else {
                // デスクトップ: wave パターンで右 3 列を残しつつ段階的に collapse。
                const EVENT_TIMES = [
                    TIMING.midShrinkStart,
                    ...TIMING.projectTransitions.map((t) => t.outAt),
                ];
                const waveProgressAt = (col: number, row: number, eventIdx: number): number => {
                    const waveCols = INITIAL_WAVE_COLS.map((c) => c - eventIdx);
                    const idx = waveCols.indexOf(col);
                    if (idx >= 0) return WAVE_PROGRESS_GRID[idx][row - 1];
                    return col > Math.max(...waveCols) ? 0 : 1.0;
                };
                const scaleVars = (progress: number) => ({
                    scale: 1 - progress,
                    rotationX: progress * 90,
                });

                midTiles.forEach((el) => {
                    const stagger = Number(el.getAttribute('data-mid-delay')) || 0;
                    const col = Number(el.getAttribute('data-tile-col'));
                    const row = Number(el.getAttribute('data-tile-row'));

                    const progression: { time: number; progress: number }[] = [];
                    let prev = -1;
                    EVENT_TIMES.forEach((time, idx) => {
                        const p = waveProgressAt(col, row, idx);
                        if (p !== prev) {
                            progression.push({ time, progress: p });
                            prev = p;
                        }
                    });

                    progression.forEach(({ time, progress }, entryIdx) => {
                        const isPhaseD = entryIdx === 0 && time === TIMING.midShrinkStart;
                        const settleStart =
                            time + TIMING.shiftSettleOffset + (isPhaseD ? stagger : 0);
                        const settleEnd = settleStart + TIMING.midShrinkDuration;
                        tl.to(
                            el,
                            {
                                ...scaleVars(progress),
                                duration: TIMING.midShrinkDuration,
                                ease: 'power3.out',
                            },
                            settleStart,
                        );

                        if (progress > 0 && progress < 1.0) {
                            const nextEventTime =
                                entryIdx + 1 < progression.length
                                    ? progression[entryIdx + 1].time
                                    : TIMING.timelineEnd;
                            const driftDuration = Math.max(0.05, nextEventTime - settleEnd);
                            const growbackTarget = Math.max(0, progress - WAVE_GROWBACK);
                            tl.to(
                                el,
                                {
                                    ...scaleVars(growbackTarget),
                                    duration: driftDuration,
                                    ease: 'none',
                                },
                                settleEnd,
                            );
                        }
                    });
                });
            }

            tl.to(
                heroLayer,
                { opacity: 0, duration: TIMING.heroFadeDuration, ease: 'power2.out' },
                TIMING.heroFadeStart,
            );

            // ─── Phase E: WORKS heading reveal ───
            tl.to([ruleLeft, ruleRight], { scaleX: 1, duration: 0.08, ease: 'power2.out' }, TIMING.worksRule);
            tl.to(sublabel, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.worksSubLabel);
            gsap.set(headingChars, { yPercent: -110, y: 0, opacity: 0 });
            tl.fromTo(
                headingChars,
                { opacity: 0, yPercent: -110, y: 0 },
                {
                    opacity: 1,
                    yPercent: 0,
                    y: 0,
                    stagger: TIMING.worksHeadingStagger,
                    duration: TIMING.worksHeadingDuration,
                    ease: 'power3.out',
                },
                TIMING.worksHeading,
            );
            tl.to(meta, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.worksMeta);

            // ─── Phase F: WORKS hold → Project 01 → 02 → 03 ───
            projectStages.forEach((el) => {
                gsap.set(el, { opacity: 0, y: 18 });
            });

            const transitions = TIMING.projectTransitions.map((t, i) => ({
                ...t,
                outTarget: i === 0 ? worksStage : projectStage(TIMING.projectTransitions[i - 1].id),
            }));

            transitions.forEach(({ id, outAt, outTarget, inAt }) => {
                if (outTarget) {
                    tl.to(
                        outTarget,
                        { opacity: 0, y: -18, duration: TIMING.projectOutDuration, ease: 'power2.in' },
                        outAt,
                    );
                }
                const inTarget = projectStage(id);
                if (inTarget) {
                    tl.to(
                        inTarget,
                        { opacity: 1, y: 0, duration: TIMING.projectInDuration, ease: 'power3.out' },
                        inAt,
                    );
                    tl.to(
                        projectRules(id),
                        { scaleX: 1, duration: TIMING.projectRuleDuration, ease: 'power2.out' },
                        inAt + 0.02,
                    );
                }
            });

            // ─── Phase G: Outro ───
            const sweptStage = projectStage('03');
            if (sweptStage) {
                tl.to(
                    sweptStage,
                    {
                        opacity: 0,
                        y: -18,
                        duration: TIMING.outroSweptFadeOutDuration,
                        ease: 'power2.in',
                    },
                    TIMING.outroSweptFadeOutAt,
                );
            }

            const colSpan = cfg.hiddenLeftCols + cfg.cols - 1;
            tileEls.forEach((el) => {
                const c = Number(el.getAttribute('data-tile-col'));
                const colNorm = (c + cfg.hiddenLeftCols) / colSpan;
                const fadeStart =
                    TIMING.outroSweepStart + colNorm * TIMING.outroSweepStaggerWindow;
                tl.to(
                    el,
                    {
                        scale: 0,
                        rotationX: 90,
                        duration: TIMING.outroSweepFadeDuration,
                        ease: 'power3.in',
                    },
                    fadeStart,
                );
            });

            const bioStage = container.querySelector<HTMLElement>('[data-stage="bio"]');
            if (bioStage) {
                gsap.set(bioStage, { opacity: 0, y: 18 });
                tl.to(
                    bioStage,
                    {
                        opacity: 1,
                        y: 0,
                        duration: TIMING.outroBioFadeInDuration,
                        ease: 'power3.out',
                    },
                    TIMING.outroBioFadeInAt,
                );
            }

            tl.to({}, { duration: 0.01 }, TIMING.outroEnd);
        },
    });

    const { noFolderBandTopVh, noFolderBandHeightVh } = config;

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100vh' : `${SECTION_MIN_HEIGHT_VH}vh` }}
        >
            <div
                data-pin-inner
                className="relative w-full h-screen overflow-hidden bg-background isolate"
            >
                {/* z-10: Cloudflare hero (folders に覆われ Phase D で fade out) */}
                <HeroLayer />

                {/* z-20: folder grid */}
                <FolderGrid key={isMobile ? 'mobile' : 'desktop'} config={config} />

                {/* z-40: WORKS heading stage */}
                <WorksStage
                    reduced={reduced}
                    bandTopVh={noFolderBandTopVh}
                    bandHeightVh={noFolderBandHeightVh}
                />

                {/* z-40: project stages */}
                {!reduced && PROJECTS.map((p) => (
                    <ProjectStage
                        key={p.id}
                        project={p}
                        reduced={reduced}
                        bandTopVh={noFolderBandTopVh}
                        bandHeightVh={noFolderBandHeightVh}
                    />
                ))}

                {/* z-40: Bio intro stage */}
                {!reduced && (
                    <BioIntroStage
                        bandTopVh={noFolderBandTopVh}
                        bandHeightVh={noFolderBandHeightVh}
                    />
                )}
            </div>

            {/* reduced-motion 用 static fallback */}
            {reduced && <ReducedFallback />}
        </section>
    );
};

const CF_PRODUCTS = [
    'Workers', 'D1', 'R2', 'Durable Objects', 'Workers AI', 'Email Routing', 'Zero Trust',
];

// Cloudflare hero (z-10)
const HeroLayer: React.FC = () => (
    <div data-hero-layer className="absolute inset-0 z-10 flex items-center">
        <div
            data-hero-row
            className="relative w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-10 md:gap-16"
        >
            <div className="order-2 md:order-1">
                <h2
                    data-lead-heading
                    className="font-sans font-bold text-foreground text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-tight max-w-xl"
                >
                    <SplitChars text="Cloudflare が好きで、" className="block overflow-hidden" dataAnim />
                    <SplitChars
                        text="いろいろ試しながら作っています。"
                        className="block overflow-hidden text-foreground/70"
                        dataAnim
                    />
                </h2>

                {/* CF product stack — staggered reveal in Phase A */}
                <div
                    data-lead-statbadge
                    style={{ opacity: 0 }}
                    className="mt-5 flex items-center gap-2 font-mono"
                >
                    <span className="text-accent text-xs">+</span>
                    <span className="text-2xs uppercase tracking-[0.4em] text-muted-foreground">CF Products in use</span>
                    <span aria-hidden className="h-px bg-foreground/15 w-12" />
                </div>

                <ul className="mt-3 flex flex-wrap gap-1.5">
                    {CF_PRODUCTS.map((p) => (
                        <li
                            key={p}
                            data-lead-stat
                            style={{ opacity: 0 }}
                            className="font-mono text-xs text-foreground/70 border border-foreground/15 px-2 py-0.5 leading-tight"
                        >
                            {p}
                        </li>
                    ))}
                </ul>

                <p
                    data-lead-statcount
                    style={{ opacity: 0 }}
                    className="mt-3 font-mono text-2xs uppercase tracking-[0.35em] text-muted-foreground/55"
                >
                    {CF_PRODUCTS.length} products · all Cloudflare native
                </p>
            </div>

            <div
                data-lead-globe
                className="order-1 md:order-2 flex items-center justify-center"
            >
                <GlobeBackground className="w-full max-w-[360px] sm:max-w-[420px] md:max-w-[480px] aspect-square" />
            </div>
        </div>
    </div>
);

// WORKS heading stage (z-40)
const WorksStage: React.FC<{ reduced: boolean; bandTopVh: number; bandHeightVh: number }> = ({
    reduced,
    bandTopVh,
    bandHeightVh,
}) => (
    <div
        data-stage="works"
        className="absolute left-0 right-0 z-40 px-6 md:px-12 flex flex-col justify-center"
        style={{
            top: `${bandTopVh}vh`,
            height: `${bandHeightVh}vh`,
        }}
    >
        <div className="max-w-7xl w-full">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
                <span
                    aria-hidden
                    data-trans-rule="left"
                    className="h-px bg-foreground/40 origin-right flex-1"
                    style={{ transform: reduced ? undefined : 'scaleX(0)' }}
                />
                <p
                    data-trans-sublabel
                    data-reveal
                    className="font-mono text-2xs md:text-xs uppercase tracking-[0.5em] text-muted-foreground whitespace-nowrap"
                >
                    <span className="text-accent">+</span>
                    <span className="ml-3">Section 02 / In Production</span>
                </p>
                <span
                    aria-hidden
                    data-trans-rule="right"
                    className="h-px bg-foreground/40 origin-left flex-1"
                    style={{ transform: reduced ? undefined : 'scaleX(0)' }}
                />
            </div>

            <h2
                data-trans-heading
                className="font-sans font-black text-foreground text-left text-[clamp(4rem,18vw,16rem)] leading-[0.85] tracking-[-0.04em]"
            >
                <SplitChars text="WORKS" className="block overflow-hidden" dataAnim />
            </h2>

            <div className="mt-6 md:mt-8 flex flex-col items-start gap-5">
                <p
                    data-trans-meta
                    data-reveal
                    className="font-mono text-xs md:text-xs uppercase tracking-[0.35em] text-muted-foreground/80 text-left"
                >
                    03 projects · solo-shipped on Cloudflare
                </p>
            </div>
        </div>
    </div>
);

// Bio intro stage (z-40)
const BioIntroStage: React.FC<{ bandTopVh: number; bandHeightVh: number }> = ({
    bandTopVh,
    bandHeightVh,
}) => (
    <div
        data-stage="bio"
        className="absolute left-0 right-0 z-40 px-6 md:px-12 flex flex-col justify-center"
        style={{
            top: `${bandTopVh}vh`,
            height: `${bandHeightVh}vh`,
            opacity: 0,
        }}
    >
        <div className="max-w-3xl w-full mx-auto">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
                <span aria-hidden className="h-px bg-foreground/40 flex-1" />
                <p className="font-mono text-2xs md:text-xs uppercase tracking-[0.5em] text-muted-foreground whitespace-nowrap">
                    <span className="text-accent">+</span>
                    <span className="ml-3">Section 03 / About</span>
                </p>
                <span aria-hidden className="h-px bg-foreground/40 flex-1" />
            </div>

            <div className="flex flex-col items-center text-center gap-5 md:gap-6">
                <div className="relative w-[150px] h-[190px] md:w-[180px] md:h-[230px] border border-foreground/30 bg-foreground/5 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-2xl font-bold tracking-[0.2em] text-foreground/30">
                            S.T.
                        </span>
                    </div>
                    <span aria-hidden className="absolute -top-1 -right-1 w-2 h-2 bg-accent" />
                </div>

                <h2 className="font-sans font-black text-foreground text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
                    Shogo Toyoshima
                </h2>

                <p className="font-sans text-sm md:text-base text-foreground/80 leading-relaxed max-w-xl">
                    デザイナーとして始まって、気づいたら実装もやるようになっていた。
                </p>

                <p className="mt-2 font-mono text-2xs uppercase tracking-[0.4em] text-muted-foreground/70">
                    <span className="text-accent">↓</span>
                    <span className="ml-3">Scroll for Timeline / Stack</span>
                </p>
            </div>
        </div>
    </div>
);

// reduced-motion fallback
const ReducedFallback: React.FC = () => (
    <div className="relative px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
            {PROJECTS.map((p) => (
                <article key={p.id} className="border-l-2 border-accent/40 pl-6">
                    <p className="font-mono text-2xs uppercase tracking-[0.5em] text-muted-foreground mb-2">
                        Project {p.id} / {p.meta}
                    </p>
                    <h3 className="font-sans font-bold text-foreground text-3xl mb-3">
                        {p.name}
                    </h3>
                    <p className="text-foreground/80 leading-relaxed">{p.description}</p>
                </article>
            ))}
        </div>
    </div>
);

export const WorksSection: React.FC = () => <WorksLead />;
