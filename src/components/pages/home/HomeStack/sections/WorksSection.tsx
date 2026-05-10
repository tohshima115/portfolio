import { useRef } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { SplitChars } from '../primitives/SplitChars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { GlobeBackground } from '../visuals/GlobeBackground';
import { CLOUDFLARE_SERVICES, PROJECTS } from './works/data';
import {
    PIN_SCROLL_END,
    SECTION_MIN_HEIGHT_VH,
    PARTIAL_BASE,
    ROW_PROGRESS_FALLOFF,
    ROW_TOP_BONUS,
    TILE_W_VW,
    TIMING,
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
//
// 数値は normalized timeline 上の絶対位置 (constants.ts の TIMING)。
// pin 範囲は PIN_SCROLL_END (~700% 相当)。reduced-motion 時は scrollScene 自体が
// disabled で、pin の下に static fallback list を表示する。
const WorksLead: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            // ── Phase A 用 selector ──
            const globe = container.querySelector('[data-lead-globe]');
            const subLabel = container.querySelector('[data-lead-sublabel]');
            const headlineLines = container.querySelectorAll('[data-lead-line]');
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

            // ─── Phase A: Cloudflare hero reveal ───
            tl.to(globe, { opacity: 1, duration: 0.10, ease: 'power2.out' }, TIMING.heroGlobe);
            tl.to(subLabel, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.heroSubLabel);
            tl.to(
                headlineLines,
                { opacity: 1, y: 0, stagger: 0.03, duration: 0.12, ease: 'power3.out' },
                TIMING.heroHeadline,
            );
            tl.to(statsBadge, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.heroStatsBadge);
            tl.to(
                stats,
                { opacity: 1, y: 0, stagger: 0.012, duration: 0.10, ease: 'power2.out' },
                TIMING.heroStats,
            );
            tl.to(statsCount, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, TIMING.heroStatsCount);

            // ─── Phase B: folder grid 左から waterfall ───
            // 全 tile が x:-110vw → 0 で左から滑り込む。delay (data 属性) は「右側着地ほど
            // 早く出発」なので col 末 → col 0 の順に到着。同時に --travel:0→1 で layer offset
            // 方向を初期 (右向き) → 最終 (radial) に補間。
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

            // ─── Phase C: 全被覆ホールド ─── (タイムラインに何も置かない = scrub 停滞)

            // ─── Phase D: 全 tile 右シフト + 中段 shrink + hero fade ───
            // 右シフトは TILE_W_VW (=1 列ぶん) 単位で +=。Phase F の各 transition でも
            // 同じ +=TILE_W_VW を加算するので、累積的に左から hidden cols が滑り込む。
            tl.to(
                tileEls,
                {
                    x: `+=${TILE_W_VW}vw`,
                    duration: TIMING.folderShiftDuration,
                    ease: 'power4.inOut',
                },
                TIMING.folderShiftStart,
            );

            // mid tile shrink を col 左→右 / 同 col 内 row 上→下 の順で stagger。
            // シフト後の右端3列 (PARTIAL_BASE 定義列) は partial collapse で残し、
            // row 1 (最上段) は ROW_TOP_BONUS で上行ほど明確に進んだ波に見せる。
            // 完全潰し列は inOut、partial collapse は終端でゆっくり静止する .out 系。
            midTiles.forEach((el) => {
                const d = Number(el.getAttribute('data-mid-delay')) || 0;
                const col = Number(el.getAttribute('data-tile-col'));
                const row = Number(el.getAttribute('data-tile-row'));
                const base = PARTIAL_BASE[col];
                const isPartial = base !== undefined;
                const bonus = row === 1 ? ROW_TOP_BONUS : 0;
                const progress = isPartial
                    ? Math.max(0, Math.min(1, base + bonus - ROW_PROGRESS_FALLOFF * (row - 1)))
                    : 1.0;
                tl.to(
                    el,
                    {
                        scaleX: 1 - 0.5 * progress,
                        scaleY: 1 - progress,
                        duration: TIMING.midShrinkDuration,
                        ease: isPartial ? 'power3.out' : 'power4.inOut',
                    },
                    TIMING.midShrinkStart + d,
                );
            });

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
            // 各 transition は前 stage を fade out (outAt 起点) しつつ次 stage を fade in
            // (inAt 起点)、続けて rule scaleX を 1 に。
            projectStages.forEach((el) => {
                gsap.set(el, { opacity: 0, y: 18 });
            });

            // 1 個目の outTarget だけ WORKS stage、それ以外は前 project stage。
            const transitions = TIMING.projectTransitions.map((t, i) => ({
                ...t,
                outTarget: i === 0 ? worksStage : projectStage(TIMING.projectTransitions[i - 1].id),
            }));

            transitions.forEach(({ id, outAt, outTarget, inAt }) => {
                // 各 transition で folder grid を 1 列ぶん右へシフト。Phase D と同じ
                // duration / ease で滑り込ませる。
                tl.to(
                    tileEls,
                    {
                        x: `+=${TILE_W_VW}vw`,
                        duration: TIMING.folderShiftDuration,
                        ease: 'power4.inOut',
                    },
                    outAt,
                );
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
        },
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100vh' : `${SECTION_MIN_HEIGHT_VH}vh` }}
        >
            <div
                data-pin-inner
                className="relative w-full h-screen overflow-hidden bg-background"
            >
                {/* z-10: Cloudflare hero (folders に覆われ Phase D で fade out) */}
                <HeroLayer />

                {/* z-20: folder grid (左から waterfall in → 全画面被覆 → 右シフト + 中段 shrink) */}
                <FolderGrid />

                {/* z-40: WORKS heading stage (Phase E で reveal、Phase F で fade out) */}
                <WorksStage reduced={reduced} />

                {/* z-40: project stages (Phase F で順送り fade in)。同位置に重ねて opacity 切替。
                    reduced mode は scrollScene 無効なので opacity 0 のまま不可視 (fallback を別途下に表示)。 */}
                {!reduced && PROJECTS.map((p) => (
                    <ProjectStage key={p.id} project={p} reduced={reduced} />
                ))}
            </div>

            {/* reduced-motion 用 static fallback: 3 プロジェクトを通常スクロールで読めるリストに */}
            {reduced && <ReducedFallback />}
        </section>
    );
};

// Cloudflare hero (z-10): Phase A で reveal、Phase D で opacity 0 にフェードアウト。
const HeroLayer: React.FC = () => (
    <div data-hero-layer className="absolute inset-0 z-10 flex items-center">
        <div className="absolute top-6 left-6 md:top-8 md:left-12">
            <CornerLabel label="WORKS" id="01" />
        </div>
        <div
            aria-hidden
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40"
            style={{ writingMode: 'vertical-rl' }}
        >
            GLOBAL EDGE / 220+ POPS
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-10 md:gap-16">
            <div className="order-2 md:order-1">
                <p
                    data-lead-sublabel
                    data-reveal
                    className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-5 flex items-center gap-3"
                >
                    <span className="text-accent">+</span>
                    <span>Global Edge / Solo Shipper</span>
                </p>
                <h2 className="font-sans font-bold text-foreground text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-tight max-w-xl">
                    <span data-lead-line data-reveal className="block">
                        Cloudflare で個人プロダクトを
                    </span>
                    <span data-lead-line data-reveal className="block">
                        出荷している Product Engineer。
                    </span>
                </h2>
                <div className="mt-10">
                    <p
                        data-lead-statbadge
                        data-reveal
                        className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-3"
                    >
                        <span className="text-accent">+</span>
                        <span>Cloudflare Stack — In Production</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {CLOUDFLARE_SERVICES.map((s) => (
                            <span
                                key={s}
                                data-lead-stat
                                data-reveal
                                className="font-mono text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 border border-foreground/15 text-foreground/85"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                    <p
                        data-lead-statcount
                        data-reveal
                        className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 tabular-nums"
                    >
                        {String(CLOUDFLARE_SERVICES.length).padStart(2, '0')}{' '}
                        services · solo-shipped
                    </p>
                </div>
            </div>

            <div
                data-lead-globe
                style={{ opacity: 0 }}
                className="order-1 md:order-2 flex items-center justify-center"
            >
                <GlobeBackground className="w-full max-w-[360px] sm:max-w-[420px] md:max-w-[480px] aspect-square" />
            </div>
        </div>
    </div>
);

// WORKS heading stage (z-40): Phase E で SplitChars が char 単位で reveal、Phase F の
// 1 個目で project 01 へ crossfade で抜ける。
const WorksStage: React.FC<{ reduced: boolean }> = ({ reduced }) => (
    <div
        data-stage="works"
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 px-6 md:px-12"
    >
        <div className="max-w-7xl mx-auto">
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
                    className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-muted-foreground whitespace-nowrap"
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
                className="font-sans font-black text-foreground text-center text-[clamp(4rem,18vw,16rem)] leading-[0.85] tracking-[-0.04em]"
            >
                <SplitChars text="WORKS" className="block overflow-hidden" dataAnim />
            </h2>

            <div className="mt-6 md:mt-8 flex flex-col items-center gap-5">
                <p
                    data-trans-meta
                    data-reveal
                    className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.35em] text-muted-foreground/80 text-center"
                >
                    03 projects · solo-shipped on Cloudflare
                </p>
            </div>
        </div>
    </div>
);

// reduced-motion fallback: pin animation が走らないので 3 プロジェクトを縦に並べて読ませる。
const ReducedFallback: React.FC = () => (
    <div className="relative px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
            {PROJECTS.map((p) => (
                <article key={p.id} className="border-l-2 border-accent/40 pl-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground mb-2">
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

// 外部から import される唯一の export。
export const WorksSection: React.FC = () => <WorksLead />;
