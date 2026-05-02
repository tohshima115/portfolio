import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

/**
 * 遷移アニメ: Deform Line のみ。
 *
 * 参考: https://zenn.dev/er/articles/bfa3bfdfe1ac9b
 *   GLSL:
 *     uv.y *= N; uv.y = floor(uv.y);
 *     deformLine = random1d(uv.y);
 *     color = texture2D(tex, uv + vec2(deformLine, 0.0));
 *
 * SVG <filter> 等価:
 *   feTurbulence (X 一定 / Y 高周波)  → 行ごとに違う乱数の縞
 *   feColorMatrix (alpha = 0.5 固定)  → Y 方向の displacement を 0 にする
 *   feDisplacementMap (scale)         → R を使って行ごとに X だけ displacement
 *
 * GSAP は scale を 0 → 強 → 0 と動かすだけ。
 *   - cover phase で scale を上げる ⇒ 画面が行ごとに横方向にバラバラに歪む
 *   - hold (画面が崩れた状態で navigate → astro:after-swap)
 *   - reveal phase で scale を 0 に戻す ⇒ 新しいページが整って現れる
 */

const FILTER_ID = 'page-deform-filter';
const PEAK_SCALE = 80;

export const WebGLTransition: React.FC = () => {
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.5;
            const revealDuration = detail.revealDuration ?? 0.5;

            const displacement = document.querySelector(`#${FILTER_ID} feDisplacementMap`);
            if (!displacement) return;

            tlRef.current?.kill();

            const findTarget = () =>
                (document.getElementById('page-root') as HTMLElement | null) ?? document.body;
            let target = findTarget();
            target.style.filter = `url(#${FILTER_ID})`;

            const state = { scale: 0 };
            const apply = () => {
                displacement.setAttribute('scale', state.scale.toFixed(1));
            };

            const tl = gsap.timeline({
                onUpdate: apply,
                onComplete: () => {
                    target.style.filter = '';
                    document.body.style.filter = '';
                },
            });

            // Cover: scale 0 → PEAK
            tl.to(state, {
                scale: PEAK_SCALE,
                duration: coverDuration,
                ease: 'power2.in',
            });

            // hold: navigate → astro:after-swap
            tl.add(() => {
                if (detail.url) void navigate(detail.url);
            });
            tl.addPause();

            // Reveal: scale PEAK → 0
            tl.to(state, {
                scale: 0,
                duration: revealDuration,
                ease: 'power2.out',
            });

            tlRef.current = tl;

            let resumed = false;
            const resume = () => {
                if (resumed) return;
                resumed = true;
                document.removeEventListener('astro:after-swap', resume);
                clearTimeout(fallback);
                // swap 後は #page-root が新しい要素になっているので当て直す
                target = findTarget();
                target.style.filter = `url(#${FILTER_ID})`;
                tl.resume();
            };
            const fallback = window.setTimeout(resume, 1500);
            if (detail.url) {
                document.addEventListener('astro:after-swap', resume, { once: true });
            } else {
                queueMicrotask(resume);
            }
        };

        window.addEventListener(TRANSITION_EVENT, handlePlay);
        return () => {
            window.removeEventListener(TRANSITION_EVENT, handlePlay);
            tlRef.current?.kill();
            document.body.style.filter = '';
            const root = document.getElementById('page-root');
            if (root) root.style.filter = '';
        };
    }, []);

    return (
        <svg
            aria-hidden="true"
            style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        >
            <defs>
                <filter id={FILTER_ID} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                    {/* X はほぼ一定 / Y 高周波 → 行ごとに違うランダム値の縞 (静的) */}
                    <feTurbulence
                        type="turbulence"
                        baseFrequency="0 0.012"
                        numOctaves="1"
                        seed="3"
                        result="noise"
                    />
                    {/* alpha を 0.5 (中点) に固定 → Y 方向 displacement を完全にゼロ */}
                    <feColorMatrix
                        in="noise"
                        type="matrix"
                        values="1 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 0 0.5"
                        result="noiseFlat"
                    />
                    {/* R チャンネルで X 方向のみ displacement (= deform line) */}
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noiseFlat"
                        scale="0"
                        xChannelSelector="R"
                        yChannelSelector="A"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default WebGLTransition;
