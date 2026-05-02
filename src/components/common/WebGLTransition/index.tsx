import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

// Codrops "Custom Page Transitions in Astro" 記事と同じ "hop" カスタムイージング。
// 標準の power3.inOut よりも入りと出が緩やかでミドルが伸びる S 字カーブ。
if (typeof window !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    if (!CustomEase.get('hop')) {
        CustomEase.create('hop', '0.56, 0, 0.35, 0.98');
    }
}

/**
 * 遷移オーバーレイ。
 *
 * - `transition:persist` で root に置き、ナビゲーション間で生存させる前提
 * - `playWebGLTransition({ url })` の発火を購読
 * - 大量の長方形が上から降りてきて画面を覆い (cover)、navigate 完了後にそのまま下へ抜ける (reveal)
 */

type Tile = {
    /** 0..1 横位置 (左端) */
    x: number;
    /** 0..1 横幅 */
    w: number;
    /** 0..1 縦位置 (上端、最終静止位置) */
    y: number;
    /** 0..1 縦幅 */
    h: number;
    /** 落下遅延 0..1 */
    delay: number;
    /** 0..1 速度倍率 (1 が標準) */
    speed: number;
    /** 表示色 */
    background: string;
    /** ハーフトーン / ノイズ オーバーレイ用 */
    overlay?: string;
};

// 簡易な seeded random (mulberry32)
function makeRng(seed: number) {
    let t = seed >>> 0;
    return () => {
        t = (t + 0x6d2b79f5) | 0;
        let r = t;
        r = Math.imul(r ^ (r >>> 15), r | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

const PALETTE = [
    '#0a0a0a',
    '#141414',
    '#1f1f1f',
    '#2a2a2a',
    '#3a3a3a',
    '#525252',
    '#7a7a7a',
    '#a3a3a3',
    '#d0d0d0',
    '#ececec',
];

const ACCENT_COLORS = [
    'oklch(0.75 0.20 135)', // logo green
    'oklch(0.82 0.18 85)',  // accent yellow
];

function buildHalftone(rgba: string): string {
    return `radial-gradient(${rgba} 1px, transparent 1.4px) 0 0 / 6px 6px`;
}

function generateTiles(seed: number): Tile[] {
    const rand = makeRng(seed);
    const tiles: Tile[] = [];

    // ベースとなる縦長カラム。画面幅をスロットに分割し、各スロットに 1 本ずつ
    // 縦に長い長方形を置く。隣のスロットと必ず重なるよう、幅とジッタの上下限を
    // 制御している (重なり幅 > ジッタ最大ズレで隙間が生まれない)。
    const SLOT_COUNT = 11;
    const slotW = 1 / SLOT_COUNT;
    // 幅は最低でも slotW * 1.3 (= 30% オーバーラップ確保)
    const W_MIN_FACTOR = 1.3;
    const W_RAND_RANGE = 0.5;
    // ジッタは最小オーバーラップを食い潰さない範囲に抑える
    const JITTER_MAX = slotW * 0.08;

    for (let s = 0; s < SLOT_COUNT; s++) {
        const w = slotW * (W_MIN_FACTOR + rand() * W_RAND_RANGE);
        const jitterX = (rand() - 0.5) * 2 * JITTER_MAX;
        let x = s * slotW + jitterX - (w - slotW) * 0.5;
        // 端は viewport の外まで伸ばす (左右の端で隙間が出ないよう保険)
        if (s === 0) x = Math.min(x, -0.02);
        if (s === SLOT_COUNT - 1 && x + w < 1.02) x = 1.02 - w;

        // y/h: 必ず viewport 全縦をカバーするよう (y + h >= 1.05 を保証)
        const y = -rand() * 0.05;
        const h = 1.15 + rand() * 0.55;

        const isAccent = rand() < 0.06;
        const isLight = rand() < 0.2;
        const isHalftone = rand() < 0.15;

        let background: string;
        if (isAccent) {
            background = ACCENT_COLORS[Math.floor(rand() * ACCENT_COLORS.length)];
        } else if (isLight) {
            background = PALETTE[6 + Math.floor(rand() * 4)];
        } else {
            background = PALETTE[Math.floor(rand() * 6)];
        }

        let overlay: string | undefined;
        if (isHalftone) {
            const dotColor = isLight || isAccent ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)';
            overlay = buildHalftone(dotColor);
        }

        tiles.push({
            x,
            y,
            w,
            h,
            delay: rand() * 0.7,
            speed: 0.85 + rand() * 0.4,
            background,
            overlay,
        });
    }

    // バリエーション用の細めの縦長長方形 (短いもの含む) をいくつか重ねる
    const ACCENT_TILE_COUNT = 6;
    for (let i = 0; i < ACCENT_TILE_COUNT; i++) {
        const w = 0.025 + rand() * 0.06;
        const h = 0.4 + rand() * 0.7;
        const x = rand() * (1 - w);
        const y = rand() * 0.2 - 0.05;

        const isAccent = rand() < 0.25;
        const background = isAccent
            ? ACCENT_COLORS[Math.floor(rand() * ACCENT_COLORS.length)]
            : PALETTE[Math.floor(rand() * PALETTE.length)];

        tiles.push({
            x,
            y,
            w,
            h,
            delay: rand() * 0.6,
            speed: 0.8 + rand() * 0.5,
            background,
        });
    }

    return tiles;
}

export const WebGLTransition: React.FC = () => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const [active, setActive] = useState(false);
    // 遷移ごとに seed を変えると毎回違うレイアウトに。固定したい場合は定数に。
    const seedRef = useRef<number>(Math.floor(Math.random() * 0xffffffff));
    const tiles = useMemo(() => generateTiles(seedRef.current), []);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.9;
            const revealDuration = detail.revealDuration ?? 0.85;

            tlRef.current?.kill();

            const els = tileRefs.current.filter((el): el is HTMLDivElement => !!el);
            if (els.length === 0) return;

            setActive(true);

            // 初期状態: 各タイルを viewport の外 (上方向) に押し出す。
            // y を vh 単位で指定することで「viewport 高さ基準」で計算できる。
            els.forEach((el, i) => {
                const t = tiles[i];
                if (!t) return;
                const startVh = -(t.y * 100 + t.h * 100 + 10);
                gsap.set(el, { y: `${startVh}vh`, opacity: 1 });
            });

            // 各 phase で「両端を 0 速度に揃えた S 字カーブ」を使うことで、
            // hold 直前は自然に減速して着地し、hold 後は自然に加速して離れる。
            // 速度の不連続が消えるため、二段階アニメーションが連続したひとつの動きに
            // 感じられる。記事の hop ease (0.56,0,0.35,0.98) を採用。
            const fallEase = 'hop';

            // --- Phase 1: Cover ---
            const coverTl = gsap.timeline({
                onComplete: () => {
                    // 1) navigate を発火 (Astro が裏で DOM を swap)
                    if (detail.url) void navigate(detail.url);

                    // 2) astro:after-swap を待ってから Reveal を再生。
                    //    url が null / event が届かない場合の保険に timeout も設定。
                    let started = false;
                    const startReveal = () => {
                        if (started) return;
                        started = true;
                        document.removeEventListener('astro:after-swap', startReveal);
                        clearTimeout(fallbackTimer);
                        playReveal();
                    };
                    const fallbackTimer = window.setTimeout(startReveal, 1500);
                    if (detail.url) {
                        document.addEventListener('astro:after-swap', startReveal, { once: true });
                    } else {
                        // 遷移先なし: 即 Reveal
                        startReveal();
                    }
                },
            });

            els.forEach((el, i) => {
                const t = tiles[i];
                if (!t) return;
                coverTl.to(
                    el,
                    {
                        y: '0vh',
                        duration: coverDuration * t.speed,
                        ease: fallEase,
                    },
                    t.delay * coverDuration * 0.6,
                );
            });

            // --- Phase 2: Reveal ---
            const playReveal = () => {
                const revealTl = gsap.timeline({
                    onComplete: () => {
                        setActive(false);
                    },
                });

                els.forEach((el, i) => {
                    const t = tiles[i];
                    if (!t) return;
                    const endVh = (1 - t.y) * 100 + 10;
                    const tileStart = t.delay * revealDuration * 0.5;
                    const tileDuration = revealDuration * t.speed;

                    revealTl.to(
                        el,
                        {
                            y: `${endVh}vh`,
                            duration: tileDuration,
                            ease: fallEase,
                            overwrite: false,
                        },
                        tileStart,
                    );
                    // 退場の中盤からフェードアウトも重ねる。落下しながら徐々に消える。
                    // 別 property への独立トゥイーンなので overwrite:false で並走させる。
                    revealTl.to(
                        el,
                        {
                            opacity: 0,
                            duration: tileDuration * 0.7,
                            ease: 'power2.in',
                            overwrite: false,
                        },
                        tileStart + tileDuration * 0.3,
                    );
                });

                tlRef.current = revealTl;
            };

            tlRef.current = coverTl;
        };

        window.addEventListener(TRANSITION_EVENT, handlePlay);
        return () => {
            window.removeEventListener(TRANSITION_EVENT, handlePlay);
        };
    }, [tiles]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{
                zIndex: 9999,
                visibility: active ? 'visible' : 'hidden',
                contain: 'strict',
            }}
            aria-hidden="true"
        >
            {tiles.map((t, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        tileRefs.current[i] = el;
                    }}
                    style={{
                        position: 'absolute',
                        left: `${t.x * 100}%`,
                        top: `${t.y * 100}%`,
                        width: `${t.w * 100}%`,
                        height: `${t.h * 100}%`,
                        background: t.background,
                        backgroundImage: t.overlay,
                        willChange: 'transform',
                        transform: 'translateY(-200vh)',
                    }}
                />
            ))}
        </div>
    );
};

export default WebGLTransition;
