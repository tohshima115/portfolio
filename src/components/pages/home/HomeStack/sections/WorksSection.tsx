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

// 横 8 × 縦 5 = 40 stack。中段は 3 行 (row 1..3)。
const FOLDER_COLS = 8;
const FOLDER_ROWS = 5;
const TILE_W_VW = 13; // 13 × 8 = 104vw
const TILE_H_VH = 21; // 標準的な縦間隔 (row 0→1 と row N-2→N-1 で使用)
// 中段 (row 1..N-2 間) は ROW_COMPRESSED_STRIDE で詰める。
// LAYER_SCALE_Y × TILE_H 未満にすれば overlap が発生 = ユーザ指定の「マイナス間隔」。
const ROW_COMPRESSED_STRIDE_VH = 14;
// 行数を 6 → 5 に減らした分の高さを、最上/最下行と中段との余白に振り分ける。
// 元の総高 (N=6, edge=0): 21+3*12+21 = 78vh → +21vh = 99vh
// 新総高 (N=5, edge=6):    27+2*12+27 = 78vh → +21vh = 99vh (同等)
const EDGE_GAP_EXTRA_VH = 6;
const STACK_LAYERS = 4;
// 各スタックの「重なり方向」は画面中心を基準とする radial 配置。
//   front 層 → 中心に寄る方向
//   back 層  → 外側 (中心から離れる方向)
// stack の入場中 (--travel: 0..1) は initial direction (= 左から流入なので
// 全 stack 右向き = +x) と final direction (= radial) を補間し、移動中も
// 「front が viewport center を向く」状態を維持する。
const STACK_OFFSET_X_PX = 18;
const STACK_OFFSET_Y_PX = 11;

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

// 1 stack = 4 枚の folder を radial に offset させて重ねる。
// stack の (col, row) と grid center (CENTER_COL, CENTER_ROW) を基準に、
// 中心からの方向ベクトルを正規化 → 各層の offset がその方向に沿って動く。
//   front (大きい layer index) → 中心に寄る
//   back  (小さい layer index) → 外側
// CSS var `--travel` (0..1) を gsap で animate し、初期 (=左から流入のため全
// stack 右向き) → 最終 (= radial) を補間。これにより移動中も front が viewport
// center を向き続ける。
const CENTER_COL = (FOLDER_COLS - 1) / 2;
const CENTER_ROW = (FOLDER_ROWS - 1) / 2;

const FolderTileEl: React.FC<{ tile: FolderTile }> = ({ tile }) => {
    // 横方向は若干 narrow にして stack 間に visible gap、
    // 縦方向は tile セルより小さくして中段 row 同士の間に余白を確保する。
    const LAYER_SCALE_X = 0.82;
    const LAYER_SCALE_Y = 0.84;
    const layerInsetXPct = ((1 - LAYER_SCALE_X) / 2) * 100;
    const layerInsetYPct = ((1 - LAYER_SCALE_Y) / 2) * 100;

    // 最終 (settled) の中心方向ベクトル (-1..+1)
    const finalDirX = (CENTER_COL - tile.col) / CENTER_COL;
    const finalDirY = (CENTER_ROW - tile.row) / CENTER_ROW;
    // 初期方向: 全 stack は左から入るので「中心向き = +x」一律
    const initialDirX = 1;
    const initialDirY = 0;

    // CSS 変数で渡し、layer の transform で var を補間する
    const styleVars: React.CSSProperties = {
        ['--init-dx' as string]: initialDirX,
        ['--init-dy' as string]: initialDirY,
        ['--final-dx' as string]: finalDirX,
        ['--final-dy' as string]: finalDirY,
        ['--travel' as string]: 0,
    };

    // row 0 → row 1 と row N-2 → row N-1 は (TILE_H + EDGE_GAP_EXTRA) で広めに。
    // 中段 row 1..N-2 間は圧縮 stride で詰めて重ねる。
    const edgeStrideVh = TILE_H_VH + EDGE_GAP_EXTRA_VH;
    const rowTopVh = (() => {
        if (tile.row === 0) return 0;
        if (tile.row === FOLDER_ROWS - 1) {
            return (
                edgeStrideVh +
                (FOLDER_ROWS - 3) * ROW_COMPRESSED_STRIDE_VH +
                edgeStrideVh
            );
        }
        return edgeStrideVh + (tile.row - 1) * ROW_COMPRESSED_STRIDE_VH;
    })();

    // 中段行 (row 1..N-2) のスタックを shrink で消し、画面中央に WORKS reveal 用の
    // 横帯を作る。全列を対象にし、shrink 自体は col 左→右、同 col 内では row 上→下
    // の順で順送りに発火させる (delay は data-mid-delay に書き出して gsap が読む)。
    const isMid = tile.row >= 1 && tile.row <= FOLDER_ROWS - 2;
    // col -1..7 を 0..1 に正規化 (col + 1) / FOLDER_COLS
    // row 1..(N-2) を 0..1 に正規化 (row - 1) / (FOLDER_ROWS - 3)
    const midDelay = isMid
        ? ((tile.col + 1) / FOLDER_COLS) * 0.10
        + ((tile.row - 1) / Math.max(1, FOLDER_ROWS - 3)) * 0.025
        : 0;

    return (
        <div
            data-folder-tile
            data-from-left={tile.fromLeft ? '1' : '0'}
            data-tile-delay={tile.delay}
            data-mid={isMid ? '1' : '0'}
            data-mid-delay={midDelay}
            style={{
                position: 'absolute',
                left: `${tile.col * TILE_W_VW}vw`,
                top: `${rowTopVh}vh`,
                width: `${TILE_W_VW}vw`,
                height: `${TILE_H_VH}vh`,
                color: 'var(--color-foreground)',
                lineHeight: 0,
                willChange: 'transform',
                ...styleVars,
            }}
        >
            {Array.from({ length: STACK_LAYERS }).map((_, layer) => {
                // t : -1.5, -0.5, 0.5, 1.5 (back → front)
                const t = layer - (STACK_LAYERS - 1) / 2;
                const factorX = t * STACK_OFFSET_X_PX;
                const factorY = t * STACK_OFFSET_Y_PX;
                return (
                    <div
                        key={layer}
                        style={{
                            position: 'absolute',
                            top: `${layerInsetYPct}%`,
                            left: `${layerInsetXPct}%`,
                            width: `${LAYER_SCALE_X * 100}%`,
                            height: `${LAYER_SCALE_Y * 100}%`,
                            // calc 内で var(--travel) を使い、init と final を線形補間
                            transform: `translate(
                                calc(((1 - var(--travel)) * var(--init-dx) + var(--travel) * var(--final-dx)) * ${factorX}px),
                                calc(((1 - var(--travel)) * var(--init-dy) + var(--travel) * var(--final-dy)) * ${factorY}px)
                            )`,
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
            // 左に追加される hidden col (col -1)。Phase B では左外に張り付いたまま、
            // Phase D で全体右シフトされて新 col 0 のポジションに入る。
            arr.push({
                row: r,
                col: -1,
                fromLeft: true,
                delay: 1.0, // waterfall 上は最後尾扱い (見た目には影響しない)
            });
            for (let c = 0; c < FOLDER_COLS; c++) {
                // 全 folder は左から入場。最終的に右に着地する (= col 大) ものほど
                // 早く出発し、画面を横切って奥に積まれていく waterfall 順。
                // col 0 (一番左の最終位置) が最後に滑り込む。
                const colInverted = FOLDER_COLS - 1 - c;
                const rowJitter = (r / FOLDER_ROWS) * 0.15;
                const delay =
                    colInverted / Math.max(1, FOLDER_COLS - 1) + rowJitter;
                arr.push({
                    row: r,
                    col: c,
                    fromLeft: true,
                    delay: delay / 1.15,
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
            const midTiles = container.querySelectorAll<HTMLElement>(
                '[data-folder-tile][data-mid="1"]',
            );
            const heroLayer = container.querySelector('[data-hero-layer]');
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

            // Phase B: folder grid 左から waterfall 入り (0.30 ~ 0.62)
            // 全 tile が x:-110vw → 0 で左から滑り込む。delay (data 属性) は
            // 「右側着地ほど早く出発」なので col 末 → col 0 の順に到着する。
            // 同時に --travel を 0 → 1 に animate し、layer の offset 方向を
            // 「初期 (右向き)」から「最終 (radial)」へ補間する。
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
                        duration: 0.12,
                        ease: 'power3.out',
                    },
                    0.30 + d * 0.20,
                );
            });

            // Phase C: 全被覆ホールド (0.58 ~ 0.66) — 何もしない (タイルは to 完了後 0)

            // Phase D: 3 並列アニメ (0.66 ~ 0.80)
            //   1. 全 tile を x:+13vw 右シフト → 左に col -1 が入り、右端 col 7 が退場
            //   2. 中段 × 元 col 1..4 (= シフト後の新 center 4 列) を scaleY:0 +
            //      scaleX:0.5 で消し、center area に空白を作る
            //   3. Cloudflare hero (z-10) を opacity 0 にフェードアウト
            tl.to(
                tileEls,
                {
                    x: '13vw',
                    duration: 0.14,
                    ease: 'power3.inOut',
                },
                0.66,
            );
            // mid tile shrink を col 左→右 / 同 col 内 row 上→下 の順で stagger。
            // 各 tile の data-mid-delay (JSX 側で計算済み) を読んで起点に加算する。
            midTiles.forEach((el) => {
                const d = Number(el.getAttribute('data-mid-delay')) || 0;
                tl.to(
                    el,
                    {
                        scaleX: 0.5,
                        scaleY: 0,
                        duration: 0.07,
                        ease: 'power3.inOut',
                    },
                    0.66 + d,
                );
            });
            tl.to(
                heroLayer,
                {
                    opacity: 0,
                    duration: 0.14,
                    ease: 'power2.out',
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
                {/* z-10: 既存の Cloudflare hero (folders に覆われる)。
                    Phase D で folder shrink と同時にフェードアウトさせる。 */}
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

                {/* z-20: folder grid (横入り → 全画面被覆) */}
                <div
                    aria-hidden
                    className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
                >
                    {tiles.map((t, i) => (
                        <FolderTileEl key={`tile-${i}`} tile={t} />
                    ))}
                </div>

                {/* z-40: WORKS hero center content (folder shrink で空いた領域に出現) */}
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
