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
 * 遷移オーバーレイ (VFX-JS slit-scan + procedural)。
 *
 * VFX-JS のドキュメント (https://amagi.dev/vfx-js/docs/) に従い、
 * テクスチャ捕捉が確実に動く `<img>` 要素 (1x1 透過 PNG を fullscreen に伸ばしたもの)
 * に対して shader を適用する。shader は src テクスチャを使わず、`progress` と
 * `dir` uniform から完全に procedural に出力色を計算するので、フォントや
 * cross-origin といった DOM 捕捉特有の落とし穴が一切ない。
 *
 * 動き:
 * - progress = 0 : 全 fragment を discard → 透過 → ページが見える
 * - progress 0→1 (cover) : 行ごとにランダムなスピードで右端から左へ「埋まっていく」
 *   先頭エッジ付近を明るくしてストリーク / モーションブラーの質感を出す
 * - hold (画面が完全に覆われた状態で navigate → after-swap 待ち)
 * - progress 1→0 (reveal) : 同じく行ごとに引いて新ページが現れる
 */

const TRANSPARENT_PIXEL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

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

    // 行を 80 段に分割し、行ごとに 0.6〜1.0 のスピード倍率
    float row = floor(uv.y * 80.0);
    float r = 0.6 + hash11(row) * 0.4;

    // dir = +1 で "右側から左へ" 埋まる。
    // progress が 0→1 に進むに従って 1 → 0 へ閾値が動き、
    // uv.x > threshold の領域が "覆われた" 状態に。
    float coverP = clamp(progress * r * 1.25, 0.0, 1.0);
    float threshold = dir > 0.0 ? (1.0 - coverP) : coverP;

    bool covered = dir > 0.0 ? (uv.x > threshold) : (uv.x < threshold);
    if (!covered) {
        discard;
    }

    // 先頭エッジからの距離。0 = 進入直後, 1 = 行の奥側
    float distFromEdge = dir > 0.0 ? (uv.x - threshold) : (threshold - uv.x);

    // ベースの暗色 + 行ごとのバリエーション
    float base = mix(0.04, 0.13, hash11(row + 7.0));

    // 先頭付近を僅かに明るく → "leading streak / motion blur" っぽさ
    float edgeGlow = exp(-distFromEdge * 8.0) * 0.18;

    // ごくたまにアクセントカラー (logo green) をストリークに混ぜる
    float accentRand = hash11(row + 31.0);
    vec3 accent = vec3(0.55, 0.85, 0.35);
    float accentWeight = step(0.96, accentRand) * edgeGlow * 1.2;

    vec3 color = vec3(base + edgeGlow);
    color = mix(color, accent, accentWeight);

    outColor = vec4(color, 1.0);
}
`;

export const WebGLTransition: React.FC = () => {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const vfxRef = useRef<VFX | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const progressRef = useRef(0);
    const dirRef = useRef(1);
    const readyRef = useRef(false);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        let cancelled = false;

        const attach = async () => {
            try {
                const vfx = new VFX();
                vfxRef.current = vfx;
                await vfx.add(img, {
                    shader: SLIT_SHADER,
                    overflow: 0,
                    uniforms: {
                        progress: () => progressRef.current,
                        dir: () => dirRef.current,
                    },
                });
                if (cancelled) {
                    try {
                        vfx.remove(img);
                    } catch {
                        /* noop */
                    }
                    return;
                }
                readyRef.current = true;
            } catch (err) {
                console.warn('[WebGLTransition] vfx.add failed', err);
            }
        };

        if (img.complete && img.naturalWidth > 0) {
            void attach();
        } else {
            img.addEventListener('load', () => void attach(), { once: true });
        }

        return () => {
            cancelled = true;
            const vfx = vfxRef.current;
            if (vfx && img) {
                try {
                    vfx.remove(img);
                } catch {
                    /* noop */
                }
            }
            try {
                vfx?.destroy?.();
            } catch {
                /* noop */
            }
            vfxRef.current = null;
            readyRef.current = false;
        };
    }, []);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.85;
            const revealDuration = detail.revealDuration ?? 0.75;

            tlRef.current?.kill();
            dirRef.current = 1;
            progressRef.current = 0;

            const tl = gsap.timeline();

            tl.to(progressRef, {
                current: 1,
                duration: coverDuration,
                ease: 'hop',
            });

            tl.add(() => {
                if (detail.url) void navigate(detail.url);
            });
            tl.addPause();

            tl.to(progressRef, {
                current: 0,
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
        };
    }, []);

    return (
        <img
            ref={imgRef}
            src={TRANSPARENT_PIXEL}
            alt=""
            aria-hidden="true"
            // VFX-JS は要素の boundingRect を WebGL canvas のサイズ / 位置に
            // 反映するため、画面いっぱいに固定する。1x1 PNG を CSS で
            // 拡大しているだけなので、テクスチャ自体は使わなくても要素として成立する。
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                pointerEvents: 'none',
                opacity: 0,
                userSelect: 'none',
            }}
        />
    );
};

export default WebGLTransition;
