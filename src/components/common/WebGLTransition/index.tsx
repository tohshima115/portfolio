import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    if (!CustomEase.get('hop')) {
        CustomEase.create('hop', '0.56, 0, 0.35, 0.98');
    }
}

/**
 * 遷移オーバーレイ (Deform Line — SVG filter, 軽量版)。
 *
 * 参考: https://zenn.dev/er/articles/bfa3bfdfe1ac9b
 *   GLSL 実装:
 *     uv.y *= N; uv.y = floor(uv.y);
 *     deformLine = random1d(uv.y);   // 行ごとの定数乱数
 *     uv.x += deformLine * scale;    // 行ごとに横ずらし
 *
 * これを SVG filter に置き換えると:
 *   feTurbulence (X ≒ 一定 / Y 高周波) → 行ごとに違うランダム値の "縞" を生成
 *   feDisplacementMap (R チャンネルで X 方向のみ displacement)
 *   feOffset (全体の sweep)
 *
 * 前バージョンが重かった主因は baseFrequency / seed をフレームごとに動かして
 * turbulence を毎フレーム再計算していたこと。今回は turbulence パラメータを
 * "遷移開始時に 1 回だけ設定" し、フレームごとには scale と dx だけ書き換える。
 */

const FILTER_ID = 'page-deform-filter';

export const WebGLTransition: React.FC = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.55;
            const revealDuration = detail.revealDuration ?? 0.5;

            const svg = svgRef.current;
            if (!svg) return;
            const turbulence = svg.querySelector('feTurbulence');
            const displacement = svg.querySelector('feDisplacementMap');
            const offset = svg.querySelector('feOffset');
            if (!turbulence || !displacement || !offset) return;

            tlRef.current?.kill();

            // 遷移ごとに seed だけランダム化 (毎回違う Deform Line パターン)。
            // baseFrequency / numOctaves はアニメさせない → turbulence 再計算なし
            turbulence.setAttribute('seed', String(Math.floor(Math.random() * 100)));

            const target = document.body;
            target.style.filter = `url(#${FILTER_ID})`;

            const state = { scale: 0, dx: 0 };

            const apply = () => {
                displacement.setAttribute('scale', state.scale.toFixed(1));
                offset.setAttribute('dx', state.dx.toFixed(1));
            };
            apply();

            const cleanup = () => {
                target.style.filter = '';
            };

            const tl = gsap.timeline({
                onUpdate: apply,
                onComplete: cleanup,
            });

            // Cover: 行ごとの displacement が立ち上がりつつ、全体が左へ shift
            tl.to(state, {
                scale: 60,
                dx: -45,
                duration: coverDuration,
                ease: 'hop',
            });

            tl.add(() => {
                if (detail.url) void navigate(detail.url);
            });
            tl.addPause();

            // Reveal: 同じ右側へ引き戻す
            tl.to(state, {
                scale: 0,
                dx: 0,
                duration: revealDuration,
                ease: 'hop',
            });

            tlRef.current = tl;

            let resumed = false;
            const resume = () => {
                if (resumed) return;
                resumed = true;
                document.removeEventListener('astro:after-swap', resume);
                clearTimeout(fallbackTimer);
                tl.resume();
            };
            const fallbackTimer = window.setTimeout(resume, 1500);
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
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            aria-hidden="true"
            style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        >
            <defs>
                <filter id={FILTER_ID} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                    {/*
                     * baseFrequency "0.001 0.012":
                     *   X = 0.001 → ほぼ一定 (= 行内では同じ乱数)
                     *   Y = 0.012 → 縦方向に縞が出る (Deform Line の bands)
                     * numOctaves=1 で最小計算量。これらは静的に固定して使い回す。
                     */}
                    <feTurbulence
                        type="turbulence"
                        baseFrequency="0.001 0.012"
                        numOctaves="1"
                        seed="3"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="0"
                        xChannelSelector="R"
                        yChannelSelector="A" /* A は常に 0 → Y 方向歪みゼロ */
                        result="displaced"
                    />
                    <feOffset in="displaced" dx="0" dy="0" />
                </filter>
            </defs>
        </svg>
    );
};

export default WebGLTransition;
