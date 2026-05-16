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
    INITIAL_WAVE_COLS,
    WAVE_PROGRESS_GRID,
    WAVE_GROWBACK,
    TILE_W_VW,
    FOLDER_COLS,
    HIDDEN_LEFT_COLS,
    TIMING,
    NO_FOLDER_BAND_TOP_VH,
    NO_FOLDER_BAND_HEIGHT_VH,
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

            // ─── Phase D: 中段 shrink + hero fade + 連続右シフトの開始 ───
            // 右シフトは Phase D 開始 → timelineEnd まで 1 本の linear tween で連続的に進む。
            // 総シフト量 = (Phase D 1 回 + project transition 3 回) × 1 列 = 4 列ぶん = 52vw。
            // → 段階的でなく「スクロールに合わせて常にゆっくり」シフトする見た目に。
            const TOTAL_SHIFT_COLS = 1 + TIMING.projectTransitions.length;
            tl.to(
                tileEls,
                {
                    x: `+=${TOTAL_SHIFT_COLS * TILE_W_VW}vw`,
                    duration: TIMING.timelineEnd - TIMING.midShrinkStart,
                    ease: 'none',
                },
                TIMING.midShrinkStart,
            );

            // mid tile shrink — wave 方式。
            // 各 event (Phase D + 各 project transition) で wave が 1 列ずつ左にスライドし、
            // 画面の visible 右 3 列が常に同じパターン (P0/P1/P2) に見えるようにする。
            // 各 col の progress 推移を pre-compute し、変化のあった event で settle tween
            // (短い power3.out) を発行する。連続右シフトが常時動いているので、
            // settle 後に静止していても「halt」感は出ない。
            const EVENT_TIMES = [
                TIMING.midShrinkStart,
                ...TIMING.projectTransitions.map((t) => t.outAt),
            ];
            // (col, row, event) → progress を返す。
            // wave 内: WAVE_PROGRESS_GRID から row 別に lookup
            // wave より右 (画面外へ押し出される側): 0 = 縮小なしのまま (= 最小化しない)
            // wave より左 (これから入る側): 1.0 = mid 不可視
            const waveProgressAt = (
                col: number,
                row: number,
                eventIdx: number,
            ): number => {
                const waveCols = INITIAL_WAVE_COLS.map((c) => c - eventIdx);
                const idx = waveCols.indexOf(col);
                if (idx >= 0) return WAVE_PROGRESS_GRID[idx][row - 1];
                return col > Math.max(...waveCols) ? 0 : 1.0;
            };
            // progress 0 → identity (scale 1, 回転なし)
            // progress 1 → scale 0 + rotateX 90° (点に縮みつつ奥に倒れて消える)
            // 親 grid の perspective で 3D に見える。
            const scaleVars = (progress: number) => ({
                scale: 1 - progress,
                rotationX: progress * 90,
            });

            midTiles.forEach((el) => {
                const stagger = Number(el.getAttribute('data-mid-delay')) || 0;
                const col = Number(el.getAttribute('data-tile-col'));
                const row = Number(el.getAttribute('data-tile-row'));

                // この (col, row) の progress 推移 (変化のある event のみ)
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
                    // 右シフトの中盤で wave settle が発火するよう shiftSettleOffset を加算。
                    // Phase D は加えて per-tile stagger も乗せる。
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

                    // growback drift: partial 状態の row のみ、settle 後に progress を
                    // WAVE_GROWBACK ぶん減らして tile を「ある程度大きく」する。
                    // 0 (縮小なし) や 1.0 (完全潰し) には適用しない。
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
                // 右シフトは Phase D 開始時に 1 本の連続 tween で発行済み (本ループでは shift しない)。
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
            // 1) Swept (project 03) を fade out
            // 2) 全 folder tile を col 左→右の stagger で scale:0 + rotateX:90 に collapse (mid shrink と同じ方式)
            // 3) pin 内 BioIntroStage (= AboutSection の lite teaser) を fade in
            // 4) pin 終了 → 下にある AboutSection 本体 (timeline / stack 詳細) が
            //    natural flow で viewport に入ってきて、ユーザは普通にスクロールして読み進める
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

            const colSpan = HIDDEN_LEFT_COLS + FOLDER_COLS - 1; // -4..7 = 11 ぶん
            tileEls.forEach((el) => {
                const c = Number(el.getAttribute('data-tile-col'));
                const colNorm = (c + HIDDEN_LEFT_COLS) / colSpan; // 0 (左端) → 1 (右端)
                const fadeStart =
                    TIMING.outroSweepStart + colNorm * TIMING.outroSweepStaggerWindow;
                // mid shrink 同様に scale 0 + rotateX 90° で奥に倒れて消える。
                // 全 tile (top / mid / bottom row) を対象とするので、mid wave で
                // 既に scale/rotateX が動いている tile も最終的に (0, 90) に着地する。
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

            // BioIntroStage (pin 内 z-40) を opacity で fade in。
            // sweep の終盤と overlap して、folder が消え終わる頃にはほぼ可視になっている。
            // pin 解除後は pin-inner ごと viewport 外に去り、下の AboutSection 本体に
            // 通常スクロールで自然に繋がる。
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

            // 終端ダミー: timeline 全体長を outroEnd まで確保し、pin scroll が outro 完了まで届くようにする。
            tl.to({}, { duration: 0.01 }, TIMING.outroEnd);
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
                // isolate で独立 stacking context を作る。
                // pin が建つ前 (= ScrollTrigger.create 前 / hydrate 直後) は
                // position:relative + z-auto なので stacking context が立たず、
                // 内部の HeroLayer(z-10) / FolderGrid(z-20) / 各 stage(z-40) が
                // root stacking context に漏れ、index.astro の boot overlay を
                // 上から潰してフォルダーが一瞬可視になる。isolate で常時独立化。
                className="relative w-full h-screen overflow-hidden bg-background isolate"
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

                {/* z-40: Bio intro stage — Phase G outro 終盤で fade in する AboutSection への teaser。
                    no-folder band に写真 placeholder + 名前 + 短い intro + scroll hint を配置。
                    pin 解除後は下にある AboutSection 本体 (timeline / stack) に自然に繋がる。 */}
                {!reduced && <BioIntroStage />}
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
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block font-mono text-2xs uppercase tracking-[0.5em] text-muted-foreground/40"
            style={{ writingMode: 'vertical-rl' }}
        >
            GLOBAL EDGE / 220+ POPS
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-10 md:gap-16">
            <div className="order-2 md:order-1">
                <p
                    data-lead-sublabel
                    data-reveal
                    className="font-mono text-2xs uppercase tracking-[0.4em] text-muted-foreground mb-5 flex items-center gap-3"
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
                        className="font-mono text-2xs uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-3"
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
                                className="font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 border border-foreground/15 text-foreground/85"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                    <p
                        data-lead-statcount
                        data-reveal
                        className="mt-3 font-mono text-2xs uppercase tracking-[0.3em] text-muted-foreground/70 tabular-nums"
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
// 配置は no-folder band (top row 下端 ↔ bottom row 上端) を親枠として、左寄せで描画。
const WorksStage: React.FC<{ reduced: boolean }> = ({ reduced }) => (
    <div
        data-stage="works"
        className="absolute left-0 right-0 z-40 px-6 md:px-12 flex flex-col justify-center"
        style={{
            top: `${NO_FOLDER_BAND_TOP_VH}vh`,
            height: `${NO_FOLDER_BAND_HEIGHT_VH}vh`,
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

// Bio intro stage (z-40): Phase G outro 終盤で fade in する AboutSection への teaser。
// 他 stage (WORKS / Project) と違って中央寄せ。写真 placeholder + 名前 + 短い intro +
// 「scroll for timeline / stack」hint を縦並びで配置。
// pin 解除後は下の AboutSection (timeline + stack の詳細) に通常スクロールで繋がる。
const BioIntroStage: React.FC = () => (
    <div
        data-stage="bio"
        className="absolute left-0 right-0 z-40 px-6 md:px-12 flex flex-col justify-center"
        style={{
            top: `${NO_FOLDER_BAND_TOP_VH}vh`,
            height: `${NO_FOLDER_BAND_HEIGHT_VH}vh`,
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
                {/* 写真 placeholder。後で <img src="/path/to/photo.jpg" className="w-full h-full object-cover" />
                    に差し替える想定。比率 4:5 (W:H) で縦長、accent 色の小さい tag を右上に。 */}
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

// reduced-motion fallback: pin animation が走らないので 3 プロジェクトを縦に並べて読ませる。
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

// 外部から import される唯一の export。
export const WorksSection: React.FC = () => <WorksLead />;
