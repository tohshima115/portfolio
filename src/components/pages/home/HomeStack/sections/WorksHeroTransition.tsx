import { useRef, useMemo } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { SplitChars } from '../primitives/SplitChars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';

// WorksLead (Cloudflare Product Engineer) と WorksFlagshipPart (AIChatClip)
// の間に挟むトランジション。File-folder シルエットが上下からザーッとスイープイン
// → 中央が水平スリットとして残り、そこに WORKS ヒーローが立ち上がる。
//
// 構造:
//   - top row / bottom row が各 18 カラムずつ。各カラムは「本体 (高さ可変)」と
//     「タブ (内側に突き出す凸)」で 1 枚のフォルダシルエットを形成
//   - GSAP ScrollTrigger pin (+=160vh) で scrub
//     0.00 — 0.05 : 余白 (Hero 完全消失を見届ける)
//     0.05 — 0.50 : top/bottom カラムが画面外から zip in (stagger)
//     0.45 — 0.70 : sublabel + meta が水平スリット内で立ち上がる
//     0.55 — 0.85 : 巨大 WORKS ヘッダの char stagger
//     0.80 — 1.00 : プロジェクトリスト (3 件) の reveal
//
// reduced-motion: pin/timeline をスキップし最終状態の静的版を返す。

interface FolderCol {
    /** カラムの横幅 (vw) */
    w: number;
    /** 本体高さ (vh)。スリット側エッジまでの距離 */
    h: number;
    /** 本体内インセット (vh)。0 でない場合、本体のスリット側に切り欠き段ができる */
    notch?: number;
    /** タブ: スリット側にさらに突出する凸 */
    tab?: {
        /** カラム横幅に対する開始位置 (0..1) */
        x: number;
        /** カラム横幅に対する幅 (0..1) */
        w: number;
        /** タブ追加高さ (vh) */
        h: number;
    };
}

// 上下対称ではなくバラつきを持たせる。合計 w がほぼ 100vw を超えるよう設計。
const TOP_COLS: FolderCol[] = [
    { w: 7, h: 22, tab: { x: 0.15, w: 0.55, h: 2.4 } },
    { w: 4, h: 30 },
    { w: 6.5, h: 18, tab: { x: 0.4, w: 0.45, h: 1.8 }, notch: 4 },
    { w: 3.5, h: 33, tab: { x: 0.1, w: 0.6, h: 2.2 } },
    { w: 8, h: 25 },
    { w: 5, h: 32, tab: { x: 0.55, w: 0.4, h: 2.5 } },
    { w: 6, h: 19, notch: 5 },
    { w: 4.5, h: 28, tab: { x: 0.05, w: 0.45, h: 1.6 } },
    { w: 7.5, h: 24, tab: { x: 0.5, w: 0.4, h: 2.2 } },
    { w: 3, h: 35 },
    { w: 5.5, h: 21, tab: { x: 0.2, w: 0.55, h: 2 }, notch: 3 },
    { w: 6, h: 30, tab: { x: 0.0, w: 0.5, h: 1.4 } },
    { w: 4, h: 26 },
    { w: 7, h: 18, tab: { x: 0.4, w: 0.5, h: 2.6 } },
    { w: 5, h: 33, tab: { x: 0.15, w: 0.5, h: 1.8 } },
    { w: 6.5, h: 23, notch: 4 },
    { w: 4.5, h: 28, tab: { x: 0.5, w: 0.45, h: 2 } },
    { w: 7, h: 20 },
];

// bottom はオフセットを変えてバラつかせる
const BOTTOM_COLS: FolderCol[] = [
    { w: 5, h: 24, tab: { x: 0.2, w: 0.5, h: 2.2 } },
    { w: 7, h: 30, notch: 3 },
    { w: 4.5, h: 19, tab: { x: 0.45, w: 0.45, h: 1.6 } },
    { w: 6, h: 27 },
    { w: 4, h: 33, tab: { x: 0.05, w: 0.55, h: 2.4 } },
    { w: 7.5, h: 21, tab: { x: 0.4, w: 0.4, h: 1.8 } },
    { w: 5, h: 28, notch: 5 },
    { w: 6.5, h: 18, tab: { x: 0.15, w: 0.55, h: 2.6 } },
    { w: 3.5, h: 32 },
    { w: 5.5, h: 22, tab: { x: 0.5, w: 0.4, h: 2 } },
    { w: 4.5, h: 30, tab: { x: 0.1, w: 0.5, h: 1.4 } },
    { w: 7, h: 24, notch: 4 },
    { w: 3, h: 33, tab: { x: 0.2, w: 0.55, h: 2.2 } },
    { w: 6, h: 19 },
    { w: 5, h: 28, tab: { x: 0.5, w: 0.4, h: 2.4 } },
    { w: 7.5, h: 22, tab: { x: 0.05, w: 0.5, h: 1.8 }, notch: 3 },
    { w: 7, h: 31 },
    { w: 6, h: 25, tab: { x: 0.35, w: 0.5, h: 2 } },
];

// 1 カラム描画。row='top' で本体が上端から下に伸び、タブはさらに下 (スリット側) へ突出。
// row='bottom' は上下反転。
// 初期非表示は `data-row` 経由の opacity:0 + GSAP の gsap.set/fromTo で yPercent を
// 設定する。ここで inline transform を当てると gsap が % を px に正規化して固定して
// しまうため、transform は当てない。
const FolderColumn: React.FC<{
    col: FolderCol;
    row: 'top' | 'bottom';
}> = ({ col, row }) => {
    const isTop = row === 'top';
    const tabHeight = col.tab?.h ?? 0;

    return (
        <div
            data-folder-col
            className="relative shrink-0"
            style={{
                width: `${col.w}vw`,
                height: '100%',
                willChange: 'transform',
            }}
        >
            {/* 本体 */}
            <div
                className="absolute left-0 right-0 bg-foreground"
                style={{
                    [isTop ? 'top' : 'bottom']: 0,
                    height: `${col.h}vh`,
                }}
            />
            {/* notch: 本体のスリット側エッジに段差をつける (本体右半分を短くする) */}
            {col.notch && col.notch > 0 && (
                <div
                    className="absolute bg-background"
                    style={{
                        [isTop ? 'top' : 'bottom']: `${col.h - col.notch}vh`,
                        height: `${col.notch}vh`,
                        left: '50%',
                        right: 0,
                    }}
                />
            )}
            {/* tab: 本体スリット側エッジから更に突出 */}
            {col.tab && (
                <div
                    className="absolute bg-foreground"
                    style={{
                        [isTop ? 'top' : 'bottom']: `${col.h}vh`,
                        height: `${tabHeight}vh`,
                        left: `${col.tab.x * 100}%`,
                        width: `${col.tab.w * 100}%`,
                    }}
                />
            )}
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

    // stagger で使うため、列インデックスを seed とした若干のランダム delay を持つ
    const topDelays = useMemo(
        () => TOP_COLS.map((_, i) => (i * 17) % 100 / 100),
        [],
    );
    const bottomDelays = useMemo(
        () => BOTTOM_COLS.map((_, i) => (i * 23 + 11) % 100 / 100),
        [],
    );

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;
            const topCols = container.querySelectorAll<HTMLElement>('[data-row="top"] [data-folder-col]');
            const bottomCols = container.querySelectorAll<HTMLElement>('[data-row="bottom"] [data-folder-col]');
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

            // GSAP は CSS / inline の translateY(%) を px に正規化して `y` に
            // 入れることがあり、その状態で yPercent を動かしても残った y(px) で
            // 元の位置に戻ってしまう。setup 時点で y を 0 にリセットしつつ
            // yPercent を明示する。
            gsap.set(topCols, { yPercent: -110, y: 0 });
            gsap.set(bottomCols, { yPercent: 110, y: 0 });
            gsap.set(headingChars, { yPercent: -110, y: 0, opacity: 0 });

            // 0.05 — 0.50: top/bottom カラムが画面外から zip in。shuffled delay で
            // 「ザザッと同時に複数着地」する印象にする。
            topCols.forEach((el, i) => {
                tl.fromTo(
                    el,
                    { yPercent: -110, y: 0 },
                    {
                        yPercent: 0,
                        y: 0,
                        duration: 0.4,
                        ease: 'power3.out',
                    },
                    0.05 + topDelays[i] * 0.35,
                );
            });
            bottomCols.forEach((el, i) => {
                tl.fromTo(
                    el,
                    { yPercent: 110, y: 0 },
                    {
                        yPercent: 0,
                        y: 0,
                        duration: 0.4,
                        ease: 'power3.out',
                    },
                    0.05 + bottomDelays[i] * 0.35,
                );
            });

            // 0.50 — 0.65: sublabel
            tl.to(
                sublabel,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                },
                0.5,
            );

            // 0.50 — 0.62: 中央の左右ルール (水平線が中央から外側に伸びる)
            tl.to(
                [ruleLeft, ruleRight],
                {
                    scaleX: 1,
                    duration: 0.35,
                    ease: 'power2.out',
                },
                0.52,
            );

            // 0.55 — 0.85: 巨大 WORKS char stagger (上から落ちる)。
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

            // 0.80 — 0.92: meta
            tl.to(
                meta,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                },
                0.8,
            );

            // 0.85 — 1.0: project pin 3 件 stagger
            tl.to(
                pins,
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.06,
                    duration: 0.35,
                    ease: 'power2.out',
                },
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
                    SWEEP / FILE-FOLDER / 18×2
                </div>

                {/* top folder row: 上端 0 から 40vh ぶんを覆う領域 */}
                <div
                    aria-hidden
                    data-row="top"
                    className="absolute top-0 left-0 right-0 flex h-[40vh] z-10 pointer-events-none"
                >
                    {TOP_COLS.map((col, i) => (
                        <FolderColumn key={`t-${i}`} col={col} row="top" />
                    ))}
                </div>

                {/* bottom folder row */}
                <div
                    aria-hidden
                    data-row="bottom"
                    className="absolute bottom-0 left-0 right-0 flex h-[40vh] z-10 pointer-events-none"
                >
                    {BOTTOM_COLS.map((col, i) => (
                        <FolderColumn key={`b-${i}`} col={col} row="bottom" />
                    ))}
                </div>

                {/* center slit: 上下フォルダの間に残る水平帯。z-20 で folders より手前 */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 px-6 md:px-12">
                    <div className="max-w-7xl mx-auto">
                        {/* sublabel + 左右に伸びるルール */}
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

                        {/* 巨大 WORKS ヘッダ */}
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

                        {/* meta + project pin 3 件 */}
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
