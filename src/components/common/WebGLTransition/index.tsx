import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

// Codrops "Custom Page Transitions in Astro" 記事と同じ "hop" カスタムイージング。
// S 字カーブで両端の速度が 0 に近く、cover 着地と reveal 出発を滑らかに繋ぐ。
if (typeof window !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    if (!CustomEase.get('hop')) {
        CustomEase.create('hop', '0.56, 0, 0.35, 0.98');
    }
}

/**
 * 遷移オーバーレイ (横スリットスライド方式)。
 *
 * - `transition:persist` で root に置き、ナビゲーション間で生存させる前提
 * - `playWebGLTransition({ url })` の発火を購読
 * - 横長のストリップが左右からスライドインして画面を覆い、navigate 後に同じ方向へ
 *   そのまま画面外へ抜けていく。各ストリップごとに方向 / 速度 / 遅延がランダム。
 */

type Strip = {
    /** 0..1 縦位置 (上端) */
    y: number;
    /** 0..1 高さ */
    h: number;
    /** スライドイン開始遅延 0..1 */
    delay: number;
    /** 速度倍率 0.6〜1.6 */
    speed: number;
    /** 表示色 */
    background: string;
    /** オプション: ハーフトーン / ストライプ オーバーレイ */
    overlay?: string;
};

/**
 * 進入方向。+1 なら右側 viewport 外から入ってきて中央で停止し、
 * reveal で同じ右側へ戻る ("一方向から流れ込んで、引き戻す" 動き)。
 * 遷移ごとにランダムに ±1 を切り替えてもよい。今回は固定で +1。
 */
const SLIDE_FROM: 1 | -1 = 1;

// mulberry32
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

function generateStrips(seed: number): Strip[] {
    const rand = makeRng(seed);
    const strips: Strip[] = [];

    // viewport を埋め尽くすまで縦に積む。スリットの「引き延ばし感」を出すため
    // 高さを細めに (0.8〜6.5%vh)、本数を多めに。
    let y = -0.01;
    while (y < 1.01) {
        const h = 0.008 + rand() * 0.057;
        const isAccent = rand() < 0.03;
        const isLight = rand() < 0.16;
        const isHalftone = rand() < 0.1;

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

        strips.push({
            y,
            h: h + 0.003, // 隣との重なり
            // 速度を大きく散らすことで、layered な「ストリーク / モーションブラー」
            // っぽい見た目にする (速いストリップが先行、遅いものが後追いで残像)
            delay: rand() * 0.5,
            speed: 0.6 + rand() * 1.0,
            background,
            overlay,
        });

        y += h;
    }

    return strips;
}

export const WebGLTransition: React.FC = () => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const [active, setActive] = useState(false);
    const seedRef = useRef<number>(Math.floor(Math.random() * 0xffffffff));
    const strips = useMemo(() => generateStrips(seedRef.current), []);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.85;
            const revealDuration = detail.revealDuration ?? 0.85;

            tlRef.current?.kill();

            const els = stripRefs.current.filter((el): el is HTMLDivElement => !!el);
            if (els.length === 0) return;

            setActive(true);

            // 初期状態: 全ストリップを SLIDE_FROM 側 viewport 外に押し出す。
            // 一方向から「流れ込んで」きて、reveal で「同じ側へ引き戻す」動き。
            const sourceVw = SLIDE_FROM * 110;
            els.forEach((el) => {
                gsap.set(el, { x: `${sourceVw}vw` });
            });

            const fallEase = 'hop';

            // --- Phase 1: Cover ---
            const coverTl = gsap.timeline({
                onComplete: () => {
                    if (detail.url) void navigate(detail.url);

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
                        startReveal();
                    }
                },
            });

            els.forEach((el, i) => {
                const s = strips[i];
                if (!s) return;
                coverTl.to(
                    el,
                    {
                        x: '0vw',
                        duration: coverDuration * s.speed,
                        ease: fallEase,
                    },
                    s.delay * coverDuration * 0.6,
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
                    const s = strips[i];
                    if (!s) return;
                    const tileStart = s.delay * revealDuration * 0.5;
                    const tileDuration = revealDuration * s.speed;

                    revealTl.to(
                        el,
                        {
                            // cover で来た側へそのまま「引き戻す」
                            x: `${sourceVw}vw`,
                            duration: tileDuration,
                            ease: fallEase,
                            overwrite: false,
                        },
                        tileStart,
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
    }, [strips]);

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
            {strips.map((s, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        stripRefs.current[i] = el;
                    }}
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: `${s.y * 100}%`,
                        width: '100%',
                        height: `${s.h * 100}%`,
                        background: s.background,
                        backgroundImage: s.overlay,
                        willChange: 'transform',
                        transform: `translateX(${SLIDE_FROM * 110}vw)`,
                    }}
                />
            ))}
        </div>
    );
};

export default WebGLTransition;
