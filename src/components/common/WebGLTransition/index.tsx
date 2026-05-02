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
    /** -1: 左方向にスライド (右から入って左へ抜ける) / +1: 逆 */
    direction: -1 | 1;
    /** スライドイン開始遅延 0..1 */
    delay: number;
    /** 速度倍率 0.7〜1.4 */
    speed: number;
    /** 表示色 */
    background: string;
    /** オプション: ハーフトーン / ストライプ オーバーレイ */
    overlay?: string;
};

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

    // viewport を埋め尽くすまで縦に積む。各ストリップの高さは 1.5%vh 〜 12%vh。
    // 隣のストリップと少しオーバーラップさせ隙間を作らない。
    let y = -0.01;
    while (y < 1.01) {
        const h = 0.015 + rand() * 0.105;
        const isAccent = rand() < 0.04;
        const isLight = rand() < 0.18;
        const isHalftone = rand() < 0.12;

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
            h: h + 0.004, // 隣との重なり
            direction: rand() < 0.5 ? -1 : 1,
            delay: rand() * 0.6,
            speed: 0.7 + rand() * 0.7,
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

            // 初期状態: 各ストリップを direction の逆側 viewport 外に押し出す。
            // direction = -1 → 右側 (+110vw) から進入。direction = +1 → 左側 (-110vw)。
            els.forEach((el, i) => {
                const s = strips[i];
                if (!s) return;
                const startVw = -s.direction * 110;
                gsap.set(el, { x: `${startVw}vw` });
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
                    const endVw = s.direction * 110;
                    const tileStart = s.delay * revealDuration * 0.5;
                    const tileDuration = revealDuration * s.speed;

                    revealTl.to(
                        el,
                        {
                            x: `${endVw}vw`,
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
                        transform: `translateX(${-s.direction * 110}vw)`,
                    }}
                />
            ))}
        </div>
    );
};

export default WebGLTransition;
