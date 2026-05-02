import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { VFX } from '@vfx-js/core';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    if (!CustomEase.get('hop')) {
        CustomEase.create('hop', '0.56, 0, 0.35, 0.98');
    }
}

/**
 * 遷移オーバーレイ (VFX-JS slit-scan 方式)。
 *
 * - `playWebGLTransition({ url })` で発火
 * - 進入時: VFX-JS を <body> に適用し、現ページのテクスチャを横方向に「引き延ばす」
 *   shader を progress 0→1 で適用 (cover)
 * - progress が最大付近 (画面が smear で覆われた状態) で navigate を発火、
 *   `astro:after-swap` を待って DOM が新ページに差し替わったことを確認
 * - 退場時: progress 1→0 で smear が解け、新ページが現れる (reveal)
 * - 完了後 VFX-JS を破棄して通常の表示に戻す
 *
 * shader は per-row のランダムな水平オフセットを progress でスケールし、
 * direction (+1 / -1) に偏らせる。すべての行が同方向へ引き延ばされるので
 * 「現画面が一方向に流される → 戻ってきて新画面」になる。
 */

const SLIT_SHADER = /* glsl */ `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform bool autoCrop;
uniform sampler2D src;
uniform float progress;
uniform float dir;
out vec4 outColor;

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;

    // 行ごとにランダムなオフセット強度 (0.4〜1.0)
    float row = floor(uv.y * 80.0);
    float r = 0.4 + hash11(row) * 0.6;

    // progress の二乗で滑らかに立ち上がり、dir で左右どちらかに偏らせる。
    // 最大引き延ばし量は viewport 幅の 1.2 倍 (画面外まで流す)
    float shift = progress * progress * r * 1.2 * dir;

    vec2 srcUv = uv - vec2(shift, 0.0);

    // テクスチャ範囲外は端の色を引き延ばす (clamp)
    srcUv.x = clamp(srcUv.x, 0.001, 0.999);

    outColor = texture(src, srcUv);
}
`;

export const WebGLTransition: React.FC = () => {
    const vfxRef = useRef<VFX | null>(null);
    const targetRef = useRef<HTMLElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const progressRef = useRef(0);
    const dirRef = useRef(1);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.8;
            const revealDuration = detail.revealDuration ?? 0.7;

            // 既存遷移を中断
            tlRef.current?.kill();
            cleanupVfx();

            // VFX-JS を body に適用
            const vfx = new VFX();
            const target = document.body;
            vfxRef.current = vfx;
            targetRef.current = target;

            progressRef.current = 0;
            dirRef.current = 1; // +1 = 右方向に流す

            try {
                vfx.add(target, {
                    shader: SLIT_SHADER,
                    overflow: 200,
                    uniforms: {
                        progress: () => progressRef.current,
                        dir: () => dirRef.current,
                    },
                });
            } catch (err) {
                console.warn('[WebGLTransition] vfx.add failed', err);
                return;
            }

            const fallEase = 'hop';

            // --- Phase 1: Cover (progress 0 → 1) ---
            const tl = gsap.timeline();
            tl.to(progressRef, {
                current: 1,
                duration: coverDuration,
                ease: fallEase,
            });

            // navigate を発火 → astro:after-swap を待って Reveal
            tl.add(() => {
                if (!detail.url) return;
                void navigate(detail.url);
            });

            // hold (after-swap を待つ): timeline を pause、event 受信で resume
            tl.addPause();

            // --- Phase 2: Reveal (progress 1 → 0) ---
            tl.to(progressRef, {
                current: 0,
                duration: revealDuration,
                ease: fallEase,
            });

            // 完了で VFX を破棄
            tl.add(() => {
                cleanupVfx();
            });

            tlRef.current = tl;

            // after-swap を受信したら timeline を resume
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
                // url が無い場合は即 reveal
                queueMicrotask(resume);
            }
        };

        const cleanupVfx = () => {
            const vfx = vfxRef.current;
            const target = targetRef.current;
            if (vfx && target) {
                try {
                    vfx.remove(target);
                } catch {
                    // noop
                }
            }
            vfxRef.current = null;
            targetRef.current = null;
        };

        window.addEventListener(TRANSITION_EVENT, handlePlay);
        return () => {
            window.removeEventListener(TRANSITION_EVENT, handlePlay);
            tlRef.current?.kill();
            cleanupVfx();
        };
    }, []);

    // transition:persist 用の不可視ダミー要素
    return <div aria-hidden="true" style={{ display: 'none' }} />;
};

export default WebGLTransition;
