import { useRef } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { SplitChars } from '../primitives/SplitChars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';

// WorksLead (Cloudflare Product Engineer) と WorksFlagshipPart (AIChatClip)
// の間に挟むトランジション。public/folder.svg を mask-image で並べ、上下から
// ザーッと zip in → 中央スリットに WORKS ヒーロー + プロジェクト 3 件が立ち上がる。
//
// アニメは GSAP ScrollTrigger pin (+=160vh) scrub:
//   0.00 — 0.05 : 余白
//   0.05 — 0.45 : top タイル群が上から落下 (stagger 0.025 秒、tight)
//   0.10 — 0.50 : bottom タイル群が下からせり上がる
//   0.50 — 0.62 : sublabel + 左右ルール
//   0.55 — 0.85 : WORKS char stagger
//   0.80 — 1.00 : meta + project pin 3 件
//
// reduced-motion: pin/timeline をスキップし最終状態の静的版を返す。

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
    /** 左端 (vw 文字列、負も可) */
    x: string;
    /** 自身の高さに対する露出量 (% 文字列、negative inset)。-50% なら半分が枠外 */
    inset: string;
    /** 横幅 (vw) */
    w: number;
    /** 横方向反転で同じ SVG にバリエーション */
    flipX?: boolean;
    /** 個別 stagger オーバーライド (0..1) */
    delay?: number;
}

// 上下それぞれ 8 タイル。横幅と inset でランダム感を演出。
//
// 配置イメージ:
//   - TOP 行: scaleY(-1) で天地反転 → タブが「下」を向き、body が viewport の
//     上端まで伸びる。スクショ参考の「タブが中央スリットへ向かう」レイアウト。
//   - BOTTOM 行: 自然な向き (scaleY 1) で底辺アンカ → タブが「上」を向き、
//     body が下端まで伸びる。
const TOP_TILES: FolderTile[] = [
    { x: '-3vw', inset: '0%', w: 18, delay: 0.00 },
    { x: '11vw', inset: '0%', w: 14, flipX: true, delay: 0.18 },
    { x: '22vw', inset: '0%', w: 20, delay: 0.06 },
    { x: '38vw', inset: '0%', w: 16, flipX: true, delay: 0.24 },
    { x: '50vw', inset: '0%', w: 22, delay: 0.10 },
    { x: '68vw', inset: '0%', w: 14, flipX: true, delay: 0.28 },
    { x: '78vw', inset: '0%', w: 18, delay: 0.04 },
    { x: '90vw', inset: '0%', w: 16, flipX: true, delay: 0.20 },
];

const BOTTOM_TILES: FolderTile[] = [
    { x: '-3vw', inset: '0%', w: 16, flipX: true, delay: 0.10 },
    { x: '10vw', inset: '0%', w: 20, delay: 0.26 },
    { x: '26vw', inset: '0%', w: 14, flipX: true, delay: 0.16 },
    { x: '36vw', inset: '0%', w: 22, delay: 0.04 },
    { x: '54vw', inset: '0%', w: 18, flipX: true, delay: 0.22 },
    { x: '68vw', inset: '0%', w: 16, delay: 0.32 },
    { x: '80vw', inset: '0%', w: 20, flipX: true, delay: 0.12 },
    { x: '94vw', inset: '0%', w: 14, delay: 0.30 },
];

// folder.svg を mask-image でフレーム描画する 1 タイル。
// 親側で row='top' なら top:-${inset} で吊り下げ、row='bottom' なら bottom:-${inset} +
// scaleY(-1) で底面に反転配置。scale 値は data 属性で setup に渡す。
const FolderTileEl: React.FC<{
    tile: FolderTile;
    row: 'top' | 'bottom';
}> = ({ tile, row }) => {
    const isTop = row === 'top';
    const sx = tile.flipX ? -1 : 1;
    // top 行はタブが「下」(中央側) を向くよう天地反転、bottom 行は自然な向き。
    const sy = isTop ? -1 : 1;

    return (
        <div
            data-folder-tile
            data-tile-delay={tile.delay ?? 0}
            data-sx={sx}
            data-sy={sy}
            style={{
                position: 'absolute',
                left: tile.x,
                [isTop ? 'top' : 'bottom']: `-${tile.inset}`,
                width: `${tile.w}vw`,
                aspectRatio: '709 / 567',
                color: 'var(--color-foreground)',
                lineHeight: 0,
                // reduced-motion / gsap 未ロード時の最終状態を保つための初期値。
                // gsap setup 時に gsap.set で上書きされる。
                transform: `scale(${sx}, ${sy})`,
                willChange: 'transform',
            }}
        >
            <FolderShape className="block w-full h-full" />
        </div>
    );
};

const PROJECT_PINS = [
    { id: '01', label: 'AIChatClip', meta: 'Flagship · 1 paid · multi-surface' },
    { id: '02', label: 'PL Dashboard', meta: 'Cloudflare D1 · 社内運用' },
    { id: '03', label: 'Swept', meta: '起業準備 · プロダクトデザイン' },
];

export const WorksHeroTransition: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;
            const topTiles = container.querySelectorAll<HTMLElement>(
                '[data-row="top"] [data-folder-tile]',
            );
            const bottomTiles = container.querySelectorAll<HTMLElement>(
                '[data-row="bottom"] [data-folder-tile]',
            );
            const sublabel = container.querySelector('[data-trans-sublabel]');
            const headingChars = container.querySelectorAll(
                '[data-trans-heading] [data-split-chars][data-anim] > span',
            );
            const ruleLeft = container.querySelector('[data-trans-rule="left"]');
            const ruleRight = container.querySelector('[data-trans-rule="right"]');
            const meta = container.querySelector('[data-trans-meta]');
            const pins = container.querySelectorAll('[data-trans-pin]');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: '+=160%',
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.7,
                    invalidateOnRefresh: true,
                },
            });

            // GSAP に scale / yPercent を完全管理させる。inline transform を
            // 持たせず data-sx / data-sy 経由で初期 scale を渡す。
            topTiles.forEach((el) => {
                const sx = Number(el.getAttribute('data-sx')) || 1;
                const sy = Number(el.getAttribute('data-sy')) || -1;
                gsap.set(el, { yPercent: -180, y: 0, scaleX: sx, scaleY: sy });
            });
            bottomTiles.forEach((el) => {
                const sx = Number(el.getAttribute('data-sx')) || 1;
                const sy = Number(el.getAttribute('data-sy')) || 1;
                gsap.set(el, { yPercent: 180, y: 0, scaleX: sx, scaleY: sy });
            });
            gsap.set(headingChars, { yPercent: -110, y: 0, opacity: 0 });

            // top タイルが上から落下。delay を data 属性から拾って「ザザッ」感を作る。
            topTiles.forEach((el) => {
                const d = Number(el.getAttribute('data-tile-delay')) || 0;
                tl.fromTo(
                    el,
                    { yPercent: -180, y: 0 },
                    {
                        yPercent: 0,
                        y: 0,
                        duration: 0.42,
                        ease: 'power3.out',
                    },
                    0.05 + d,
                );
            });
            bottomTiles.forEach((el) => {
                const d = Number(el.getAttribute('data-tile-delay')) || 0;
                tl.fromTo(
                    el,
                    { yPercent: 180, y: 0 },
                    {
                        yPercent: 0,
                        y: 0,
                        duration: 0.42,
                        ease: 'power3.out',
                    },
                    0.10 + d,
                );
            });

            tl.to(
                sublabel,
                { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
                0.5,
            );
            tl.to(
                [ruleLeft, ruleRight],
                { scaleX: 1, duration: 0.35, ease: 'power2.out' },
                0.52,
            );
            tl.fromTo(
                headingChars,
                { opacity: 0, yPercent: -110, y: 0 },
                {
                    opacity: 1,
                    yPercent: 0,
                    y: 0,
                    stagger: 0.04,
                    duration: 0.5,
                    ease: 'power3.out',
                },
                0.55,
            );
            tl.to(
                meta,
                { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
                0.8,
            );
            tl.to(
                pins,
                { opacity: 1, y: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out' },
                0.85,
            );
        },
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100vh' : '260vh' }}
        >
            <div
                data-pin-inner
                className="relative w-full h-screen overflow-hidden bg-background"
            >
                {/* corner label */}
                <div className="absolute top-6 left-6 md:top-8 md:left-12 z-30">
                    <CornerLabel label="WORKS / TRANSITION" id="01" />
                </div>
                <div
                    aria-hidden
                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block z-30 font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40"
                    style={{ writingMode: 'vertical-rl' }}
                >
                    SWEEP / FOLDER / 12
                </div>

                {/* top tiles container: 上半分を覆う領域 */}
                <div
                    aria-hidden
                    data-row="top"
                    className="absolute top-0 left-0 right-0 h-[55vh] z-10 pointer-events-none"
                >
                    {TOP_TILES.map((tile, i) => (
                        <FolderTileEl key={`t-${i}`} tile={tile} row="top" />
                    ))}
                </div>

                {/* bottom tiles container */}
                <div
                    aria-hidden
                    data-row="bottom"
                    className="absolute bottom-0 left-0 right-0 h-[55vh] z-10 pointer-events-none"
                >
                    {BOTTOM_TILES.map((tile, i) => (
                        <FolderTileEl key={`b-${i}`} tile={tile} row="bottom" />
                    ))}
                </div>

                {/* center slit: 上下フォルダの間に残る水平帯 */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 px-6 md:px-12">
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
