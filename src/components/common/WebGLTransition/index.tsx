import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

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
    const cols = 9;
    const rows = 6;
    const tiles: Tile[] = [];
    const cellW = 1 / cols;
    const cellH = 1 / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // 各セルに 1〜2 個の長方形を重ねて配置 (オーバーラップでムラを作る)
            const count = rand() < 0.55 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                const wMul = 0.85 + rand() * 1.4; // セル幅の 0.85〜2.25 倍
                const hMul = 0.7 + rand() * 1.6;
                const w = Math.min(cellW * wMul, 0.55);
                const h = Math.min(cellH * hMul, 0.6);
                const jitterX = (rand() - 0.5) * cellW * 1.2;
                const jitterY = (rand() - 0.5) * cellH * 0.8;
                const x = Math.max(-0.05, Math.min(1 - w * 0.5, c * cellW + jitterX));
                const y = Math.max(-0.05, Math.min(1 - h * 0.4, r * cellH + jitterY));

                const isAccent = rand() < 0.04;
                const isHalftone = rand() < 0.18;
                const isLight = rand() < 0.18;

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
                    const dotColor = isLight || isAccent ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.35)';
                    overlay = buildHalftone(dotColor);
                }

                // 落下のディレイ: 列ごとに少しまとまって、行内でランダム
                const colBias = c / cols; // 左から右へやや遅らせる (or rand バリエーション)
                const delay = Math.min(0.85, Math.max(0, colBias * 0.25 + rand() * 0.55));
                const speed = 0.85 + rand() * 0.45;

                tiles.push({ x, y, w, h, delay, speed, background, overlay });
            }
        }
    }

    // 大きめの "ヒーロー" 長方形を数個重ねる (画面に強いリズムを作る)
    for (let i = 0; i < 6; i++) {
        const w = 0.08 + rand() * 0.18;
        const h = 0.35 + rand() * 0.55;
        const x = rand() * (1 - w);
        const y = rand() * 0.3;
        const isAccent = rand() < 0.18;
        const background = isAccent
            ? ACCENT_COLORS[Math.floor(rand() * ACCENT_COLORS.length)]
            : PALETTE[Math.floor(rand() * 5)];
        tiles.push({
            x,
            y,
            w,
            h,
            background,
            delay: rand() * 0.4,
            speed: 0.8 + rand() * 0.4,
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
                gsap.set(el, { y: `${startVh}vh` });
            });

            const tl = gsap.timeline({
                onComplete: () => {
                    setActive(false);
                },
            });

            // Cover phase: 上から落ちてきて静止位置 (y: 0) で止まる
            els.forEach((el, i) => {
                const t = tiles[i];
                if (!t) return;
                tl.to(
                    el,
                    {
                        y: '0vh',
                        duration: coverDuration * t.speed,
                        ease: 'power3.in',
                    },
                    t.delay * coverDuration * 0.6,
                );
            });

            // navigate: cover が概ね完了したタイミング
            const coverEnd = coverDuration + 0.05;
            tl.add(() => {
                if (detail.url) {
                    void navigate(detail.url);
                }
            }, coverEnd);

            // Reveal phase: cover 完了後、各タイルが個別の delay でさらに下へ抜ける
            const revealStart = coverEnd + 0.1;
            els.forEach((el, i) => {
                const t = tiles[i];
                if (!t) return;
                const endVh = (1 - t.y) * 100 + 10;
                tl.to(
                    el,
                    {
                        y: `${endVh}vh`,
                        duration: revealDuration * t.speed,
                        ease: 'power2.in',
                    },
                    revealStart + t.delay * revealDuration * 0.5,
                );
            });

            tlRef.current = tl;
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
