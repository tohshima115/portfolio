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
 * 遷移オーバーレイ (SVG フィルタによる現ページの直接歪み)。
 *
 * Three.js / VFX-JS のように "別のシーンを overlay する" 方式だと、
 * 「現在の画面そのものが glitch している」感が出ない。SVG フィルタを body に
 * 適用すると、ライブの DOM が GPU で feDisplacementMap 処理されるので、
 * 現在の画面が直接引き延ばされる/砂嵐がかかる挙動になる。
 *
 * Pipeline (SVG <filter>):
 *   feTurbulence (baseFrequency 0.005 / 0.5 → 横方向はほぼ一定、縦方向は高周波)
 *     ↓ 結果は per-row のランダム値 → スリットスキャン的な水平 displacement
 *   feDisplacementMap (scale を 0→80→0 でアニメ、X 方向のみ歪ませる)
 *     ↓
 *   feOffset (dx を 0→-60→0 で左方向へ全体シフト → 一方向の sweep)
 *
 * GSAP timeline:
 *   - cover (progress 0→1): scale / dx / baseFrequency が立ち上がる
 *   - hold: navigate → astro:after-swap 待機
 *   - reveal (progress 1→0): 元に戻って新ページが見える
 */

const FILTER_ID = 'page-glitch-filter';

export const WebGLTransition: React.FC = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.65;
            const revealDuration = detail.revealDuration ?? 0.55;

            const svg = svgRef.current;
            if (!svg) return;
            const turbulence = svg.querySelector('feTurbulence');
            const displacement = svg.querySelector('feDisplacementMap');
            const offset = svg.querySelector('feOffset');
            if (!turbulence || !displacement || !offset) return;

            tlRef.current?.kill();

            // body に filter を適用 (現ページが歪む対象)
            const target = document.body;
            target.style.filter = `url(#${FILTER_ID})`;
            // パフォーマンス: GPU レイヤーに昇格させると合成が速い
            target.style.willChange = 'filter';

            const state = {
                scale: 0,        // feDisplacementMap.scale  (歪みの大きさ)
                dx: 0,           // feOffset.dx              (左方向シフト)
                freqY: 0.05,     // feTurbulence.baseFrequency Y
                seed: Math.floor(Math.random() * 1000),
            };

            const apply = () => {
                turbulence.setAttribute('baseFrequency', `0.005 ${state.freqY.toFixed(4)}`);
                turbulence.setAttribute('seed', String(state.seed));
                displacement.setAttribute('scale', state.scale.toFixed(2));
                offset.setAttribute('dx', state.dx.toFixed(2));
            };
            apply();

            const cleanup = () => {
                target.style.filter = '';
                target.style.willChange = '';
            };

            const tl = gsap.timeline({
                onUpdate: apply,
                onComplete: cleanup,
            });

            // --- Cover: 画面が左方向へ引き延ばされながら歪んでいく ---
            tl.to(state, {
                scale: 90,
                dx: -65,
                freqY: 0.45,
                duration: coverDuration,
                ease: 'hop',
            });

            // --- Hold: navigate → after-swap ---
            tl.add(() => {
                if (detail.url) void navigate(detail.url);
            });
            tl.addPause();

            // --- Reveal: 歪みが解けて新ページが見える ---
            tl.to(state, {
                scale: 0,
                dx: 0,
                freqY: 0.05,
                duration: revealDuration,
                ease: 'hop',
            });

            tlRef.current = tl;

            // after-swap で resume
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
            document.body.style.willChange = '';
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            aria-hidden="true"
            // 描画は不要だが filter 参照のために DOM に存在させる
            style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        >
            <defs>
                <filter id={FILTER_ID} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                    {/*
                     * baseFrequency "0.005 0.05" → 静止時はほぼ無視できる程度のノイズ
                     * GSAP が動的に 0.45 まで上げて high-frequency horizontal bands を出す
                     */}
                    <feTurbulence
                        type="turbulence"
                        baseFrequency="0.005 0.05"
                        numOctaves="2"
                        seed="5"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="0"
                        xChannelSelector="R"
                        yChannelSelector="A" /* A は常に 0 → Y 方向の歪みは出ない */
                        result="displaced"
                    />
                    <feOffset in="displaced" dx="0" dy="0" />
                </filter>
            </defs>
        </svg>
    );
};

export default WebGLTransition;
