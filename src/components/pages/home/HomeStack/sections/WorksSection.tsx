import { useRef, useMemo } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { SplitChars } from '../primitives/SplitChars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { WorksFlagshipPart } from './WorksFlagshipPart';
import { WorksOpsCarousel } from './WorksOpsCarousel';
import { DividerMarker } from '../visuals/DividerMarker';
import { GlobeBackground } from '../visuals/GlobeBackground';

// 本番投入している Cloudflare サービス。
const CLOUDFLARE_SERVICES = [
    'Workers',
    'D1',
    'R2',
    'Durable Objects',
    'Workers AI',
    'Zero Trust',
];

const PROJECT_PINS = [
    { id: '01', label: 'AIChatClip', meta: 'Flagship · 1 paid · multi-surface' },
    { id: '02', label: 'PL Dashboard', meta: 'Cloudflare D1 · 社内運用' },
    { id: '03', label: 'Swept', meta: '起業準備 · プロダクトデザイン' },
];

// 横 6 × 縦 4 = 24 stack。各 stack は 4 枚の folder を少しずつ offset で
// 重ねて「書類の山」感を出す。スタック単位で横入りする。
const FOLDER_COLS = 6;
const FOLDER_ROWS = 4;
const TILE_W_VW = 17; // 17 × 6 = 102vw
const TILE_H_VH = 26; // 26 × 4 = 104vh
const STACK_LAYERS = 4;
const STACK_OFFSET_PX = 8; // 各層が前の層から 8px ずれる (タイル縮小に合わせて offset も小さく)

// public/folder.svg と同じパスを inline。fill: currentColor で theme color を載せる。
const FolderShape: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 709 567"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
    >
        <g transform="matrix(1,0,0,1,-1228.346457,-1086.562999)">
            <path
                fill="currentColor"
                d="M1228.346,1653.543L1937.008,1653.543L1937.008,1181.102C1937.008,1181.102 1678.894,1180.896 1606.299,1181.102C1487.818,1181.44 1535.151,1086.851 1417.323,1086.614C1359.999,1086.499 1228.346,1086.614 1228.346,1086.614L1228.346,1653.543Z"
            />
        </g>
    </svg>
);

interface FolderTile {
    row: number;
    col: number;
    /** 横入りの方向。true=画面左から、false=画面右から */
    fromLeft: boolean;
    /** stagger 用 (0..1) */
    delay: number;
}

// 1 stack = 4 枚の folder を staircase に offset させて重ねる。
// 内側 layer は tile box より小さく中央配置 → stack 同士の間に visible gap が残る。
// transform は外側 wrapper (data-folder-tile) で xPercent 横入りされ、
// 内側 layers は inset の中央寄せ + translate(±offsetPx) で「pile」の見た目を作る。
const FolderTileEl: React.FC<{ tile: FolderTile }> = ({ tile }) => {
    // tile box に対する layer の比率。0.78 だと両側 11% ずつ余白 (= 約 2.8vw / 4vh)。
    const LAYER_SCALE = 0.78;
    const layerInsetPct = ((1 - LAYER_SCALE) / 2) * 100;
    return (
        <div
            data-folder-tile
            data-from-left={tile.fromLeft ? '1' : '0'}
            data-tile-delay={tile.delay}
            style={{
                position: 'absolute',
                left: `${tile.col * TILE_W_VW}vw`,
                top: `${tile.row * TILE_H_VH}vh`,
                width: `${TILE_W_VW}vw`,
                height: `${TILE_H_VH}vh`,
                color: 'var(--color-foreground)',
                lineHeight: 0,
                willChange: 'transform',
            }}
        >
            {Array.from({ length: STACK_LAYERS }).map((_, layer) => {
                // 中央寄せの staircase 配置。
                //   layer=0 (back) : (-offset, -offset)
                //   layer=N-1 (front): (+offset, +offset)
                const dx = (layer - (STACK_LAYERS - 1) / 2) * STACK_OFFSET_PX;
                const dy = (layer - (STACK_LAYERS - 1) / 2) * STACK_OFFSET_PX;
                return (
                    <div
                        key={layer}
                        style={{
                            position: 'absolute',
                            top: `${layerInsetPct}%`,
                            left: `${layerInsetPct}%`,
                            width: `${LAYER_SCALE * 100}%`,
                            height: `${LAYER_SCALE * 100}%`,
                            transform: `translate(${dx}px, ${dy}px)`,
                            zIndex: layer,
                        }}
                    >
                        <FolderShape className="block w-full h-full" />
                    </div>
                );
            })}
        </div>
    );
};

// WorksLead = Cloudflare hero + folder cover + WORKS reveal を 1 つの pin
// セクションに統合。
//
// pin 範囲 +=300% で 5 フェーズ:
//   0.00 — 0.05 : idle (Hero 完全消失を見届ける一拍)
//   0.05 — 0.32 : 既存 reveal (globe / sublabel / headline / chips / count)
//   0.36 — 0.58 : folder grid (6×4=24) が左右交互から zip in、最終的に全画面被覆
//   0.58 — 0.66 : 全被覆ホールド
//   0.66 — 0.78 : 中央 punch-out が h:0 → h:50vh で展開 (折り返しで center が抜ける)
//   0.78 — 0.92 : WORKS heading + 左右 rule + meta
//   0.90 — 1.00 : project pin 3 件 stagger
//
// reduced-motion: timeline スキップ。folder の最終 transform / center punch の
// 展開は inline default で「最終状態に近いがアニメ無し」になる。
const WorksLead: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    const tiles = useMemo<FolderTile[]>(() => {
        const arr: FolderTile[] = [];
        for (let r = 0; r < FOLDER_ROWS; r++) {
            for (let c = 0; c < FOLDER_COLS; c++) {
                const idx = r * FOLDER_COLS + c;
                arr.push({
                    row: r,
                    col: c,
                    fromLeft: (idx % 2) === 0,
                    // delay は (col, row) 由来で「左右からほぼ同時に湧く」感を出す
                    delay: ((c * 1.7 + r * 2.3) % 5) / 5,
                });
            }
        }
        return arr;
    }, []);

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            // existing lead reveal
            const globe = container.querySelector('[data-lead-globe]');
            const subLabel = container.querySelector('[data-lead-sublabel]');
            const headlineLines = container.querySelectorAll('[data-lead-line]');
            const statsBadge = container.querySelector('[data-lead-statbadge]');
            const stats = container.querySelectorAll('[data-lead-stat]');
            const statsCount = container.querySelector('[data-lead-statcount]');

            // folder + WORKS reveal
            const tileEls = container.querySelectorAll<HTMLElement>('[data-folder-tile]');
            const punch = container.querySelector('[data-trans-punch]');
            const sublabel = container.querySelector('[data-trans-sublabel]');
            const ruleLeft = container.querySelector('[data-trans-rule="left"]');
            const ruleRight = container.querySelector('[data-trans-rule="right"]');
            const headingChars = container.querySelectorAll(
                '[data-trans-heading] [data-split-chars][data-anim] > span',
            );
            const meta = container.querySelector('[data-trans-meta]');
            const pins = container.querySelectorAll('[data-trans-pin]');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: '+=300%',
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.7,
                    invalidateOnRefresh: true,
                },
            });

            // Phase A: 既存 lead reveal (0.05 ~ 0.32)
            tl.to(globe, { opacity: 1, duration: 0.10, ease: 'power2.out' }, 0.05);
            tl.to(
                subLabel,
                { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
                0.10,
            );
            tl.to(
                headlineLines,
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.03,
                    duration: 0.12,
                    ease: 'power3.out',
                },
                0.13,
            );
            tl.to(
                statsBadge,
                { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
                0.20,
            );
            tl.to(
                stats,
                { opacity: 1, y: 0, stagger: 0.012, duration: 0.10, ease: 'power2.out' },
                0.23,
            );
            tl.to(
                statsCount,
                { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
                0.30,
            );

            // Phase B: folder grid 横入り (0.36 ~ 0.58)
            // xPercent (= タイル幅基準) だと grid 中央の tile が viewport に残る。
            // x に viewport 単位文字列を渡して全 tile を確実に画面外へ。
            tileEls.forEach((el) => {
                const fromLeft = el.getAttribute('data-from-left') === '1';
                const fromX = fromLeft ? '-110vw' : '110vw';
                gsap.set(el, { x: fromX, xPercent: 0 });
            });
            tileEls.forEach((el) => {
                const fromLeft = el.getAttribute('data-from-left') === '1';
                const fromX = fromLeft ? '-110vw' : '110vw';
                const d = Number(el.getAttribute('data-tile-delay')) || 0;
                tl.fromTo(
                    el,
                    { x: fromX, xPercent: 0 },
                    {
                        x: 0,
                        xPercent: 0,
                        duration: 0.18,
                        ease: 'power3.out',
                    },
                    0.36 + d * 0.18,
                );
            });

            // Phase C: 全被覆ホールド (0.58 ~ 0.66) — 何もしない (タイルは to 完了後 0)

            // Phase D: 中央 punch-out (0.66 ~ 0.78)
            tl.fromTo(
                punch,
                { height: 0 },
                {
                    height: '52vh',
                    duration: 0.12,
                    ease: 'power3.inOut',
                },
                0.66,
            );

            // Phase E: WORKS heading + meta (0.78 ~ 1.00)
            tl.to(
                [ruleLeft, ruleRight],
                { scaleX: 1, duration: 0.08, ease: 'power2.out' },
                0.78,
            );
            tl.to(
                sublabel,
                { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
                0.78,
            );
            gsap.set(headingChars, { yPercent: -110, y: 0, opacity: 0 });
            tl.fromTo(
                headingChars,
                { opacity: 0, yPercent: -110, y: 0 },
                {
                    opacity: 1,
                    yPercent: 0,
                    y: 0,
                    stagger: 0.025,
                    duration: 0.18,
                    ease: 'power3.out',
                },
                0.82,
            );
            tl.to(
                meta,
                { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
                0.90,
            );
            tl.to(
                pins,
                { opacity: 1, y: 0, stagger: 0.025, duration: 0.10, ease: 'power2.out' },
                0.92,
            );
        },
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100vh' : '400vh' }}
        >
            <div
                data-pin-inner
                className="relative w-full h-screen overflow-hidden bg-background"
            >
                {/* z-10: 既存の Cloudflare hero (folders に覆われる) */}
                <div className="absolute inset-0 z-10 flex items-center">
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

                {/* z-20: folder grid (横入り → 全画面被覆) */}
                <div
                    aria-hidden
                    className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
                >
                    {tiles.map((t, i) => (
                        <FolderTileEl key={`tile-${i}`} tile={t} />
                    ))}
                </div>

                {/* z-30: 中央 punch-out (folders を背景色で覆って center が抜けて見える効果) */}
                <div
                    aria-hidden
                    data-trans-punch
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 bg-background pointer-events-none"
                    style={{ height: 0 }}
                />

                {/* z-40: WORKS hero center content (punch の上) */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 px-6 md:px-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-4 mb-6 md:mb-8">
                            <span
                                aria-hidden
                                data-trans-rule="left"
                                className="h-px bg-foreground/40 origin-right flex-1"
                                style={{
                                    transform: reduced ? undefined : 'scaleX(0)',
                                }}
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
                                style={{
                                    transform: reduced ? undefined : 'scaleX(0)',
                                }}
                            />
                        </div>

                        <h2
                            data-trans-heading
                            className="font-sans font-black text-foreground text-center text-[clamp(4rem,18vw,16rem)] leading-[0.85] tracking-[-0.04em]"
                        >
                            <SplitChars
                                text="WORKS"
                                className="block overflow-hidden"
                                dataAnim
                            />
                        </h2>

                        <div className="mt-6 md:mt-8 flex flex-col items-center gap-5">
                            <p
                                data-trans-meta
                                data-reveal
                                className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.35em] text-muted-foreground/80 text-center"
                            >
                                03 projects · solo-shipped on Cloudflare
                            </p>
                            <ul className="flex flex-wrap justify-center gap-x-6 md:gap-x-10 gap-y-3">
                                {PROJECT_PINS.map((p) => (
                                    <li
                                        key={p.id}
                                        data-trans-pin
                                        data-reveal
                                        className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/85"
                                    >
                                        <span className="text-accent tabular-nums">
                                            {p.id}
                                        </span>
                                        <span className="font-sans font-bold tracking-tight text-foreground">
                                            {p.label}
                                        </span>
                                        <span className="text-muted-foreground/60 hidden md:inline">
                                            / {p.meta}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Works = WorksLead (Cloudflare anchor + folder cover + WORKS reveal を 1 pin に統合)
//       → WorksFlagshipPart (AIChatClip)
//       → WorksOpsCarousel (PL Dashboard / Expense / Schedule)
export const WorksSection: React.FC = () => {
    return (
        <>
            <WorksLead />
            <WorksFlagshipPart />
            <DividerMarker py={48} />
            <WorksOpsCarousel />
        </>
    );
};
