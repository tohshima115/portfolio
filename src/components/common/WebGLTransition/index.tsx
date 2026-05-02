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
 * 遷移オーバーレイ (VFX-JS slit-scan 方式 / overlay 適用)。
 *
 * 注意: VFX-JS の dom-to-canvas は body 全体に対しては foreignObject SVG の
 *       capture が失敗する (Google Fonts / cross-origin / 複雑な CSS) ため、
 *       単純な CSS gradient 背景の overlay 要素にのみ shader を適用する。
 *
 * - progress = 0: shader が全フラグメントを discard → overlay は透明 → ページ可視
 * - progress 0→1 (cover): 行ごとに ±dir 方向へ uv をオフセットしつつ、
 *   ベースシフト ((1-progress)*dir) で初期は範囲外 (discard) だったテクスチャが
 *   範囲内 (描画) に入ってきて、最終的に画面全体を覆う
 * - progress 1→0 (reveal): 逆に範囲外へ流れて discard されていき、ページが現れる
 */

const SLIT_SHADER = /* glsl */ `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
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

    // 行を 64 段に分割し、行ごとに 0.4〜1.0 のスピード倍率
    float row = floor(uv.y * 64.0);
    float r = 0.4 + hash11(row) * 0.6;

    // 1) baseShift: progress 0 で uv が範囲外 (discard)、progress 1 で範囲内
    //    (= 一方向から sweep してくる動き)。dir=+1 で右から左に流れる。
    float baseShift = (1.0 - progress) * r * dir;

    // 2) smear: progress 0.5 付近で最大、progress=1 では 0。行ごとにランダム量。
    //    モーションブラーっぽい streak を出す。
    float smearStrength = progress * (1.0 - progress) * 4.0;
    float smear = smearStrength * (hash11(row + 17.0) - 0.5) * 1.2 * dir;

    float shift = baseShift + smear;

    vec2 srcUv = uv - vec2(shift, 0.0);
    if (srcUv.x < 0.0 || srcUv.x > 1.0) {
        discard;
    }

    outColor = texture(src, srcUv);
}
`;

export const WebGLTransition: React.FC = () => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const vfxRef = useRef<VFX | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const progressRef = useRef(0);
    const dirRef = useRef(1);
    const vfxAttachedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        const overlay = overlayRef.current;
        if (!overlay) return;

        // VFX-JS 初期化 + overlay へ shader を attach。component 寿命中ずっと
        // 適用しっぱなしにする (progress=0 では discard なので透明)。
        try {
            const vfx = new VFX();
            vfxRef.current = vfx;
            void vfx
                .add(overlay, {
                    shader: SLIT_SHADER,
                    overflow: 100,
                    uniforms: {
                        progress: () => progressRef.current,
                        dir: () => dirRef.current,
                    },
                })
                .then(() => {
                    if (!cancelled) vfxAttachedRef.current = true;
                })
                .catch((err: unknown) => {
                    console.warn('[WebGLTransition] vfx.add failed', err);
                });
        } catch (err) {
            console.warn('[WebGLTransition] VFX init failed', err);
        }

        return () => {
            cancelled = true;
            const v = vfxRef.current;
            const o = overlayRef.current;
            if (v && o) {
                try {
                    v.remove(o);
                } catch {
                    // noop
                }
            }
            vfxRef.current = null;
            vfxAttachedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.85;
            const revealDuration = detail.revealDuration ?? 0.75;

            tlRef.current?.kill();

            // dir は進行方向。ここでは固定 (+1: 右側から sweep)。
            dirRef.current = 1;
            progressRef.current = 0;

            const fallEase = 'hop';

            const tl = gsap.timeline();

            // --- Cover: progress 0 → 1 ---
            tl.to(progressRef, {
                current: 1,
                duration: coverDuration,
                ease: fallEase,
            });

            // navigate 発火 + hold (after-swap 待ち)
            tl.add(() => {
                if (detail.url) void navigate(detail.url);
            });
            tl.addPause();

            // --- Reveal: progress 1 → 0 ---
            tl.to(progressRef, {
                current: 0,
                duration: revealDuration,
                ease: fallEase,
            });

            tlRef.current = tl;

            // after-swap で resume。fallback timeout も設定。
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
        };
    }, []);

    return (
        <div
            ref={overlayRef}
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                pointerEvents: 'none',
                // VFX-JS が capture する overlay 自体の見た目。
                // 細かい横ストライプを敷くことで、shader の uv ずれが
                // モーションブラー / streak 風に見える。
                background:
                    'repeating-linear-gradient(' +
                    '0deg,' +
                    '#0a0a0a 0px,' +
                    '#0a0a0a 3px,' +
                    '#1a1a1a 3px,' +
                    '#1a1a1a 6px' +
                    ')',
            }}
        />
    );
};

export default WebGLTransition;
