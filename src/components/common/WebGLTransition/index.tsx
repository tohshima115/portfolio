import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { toPng } from 'html-to-image';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

/**
 * 画面遷移エフェクト: 記事の Deform Line を画面スナップショットに対して適用。
 * https://zenn.dev/er/articles/bfa3bfdfe1ac9b
 *
 * 構成:
 *  1. 遷移開始時に html-to-image で #page-root を PNG スナップショット
 *     (= ライブの DOM ではなく "ラスタライズ済みの 1 枚絵" を扱う = 軽い)
 *  2. その画像を Three.js のフルスクリーン quad のテクスチャにセット
 *  3. fragment shader は記事ほぼそのまま:
 *       uv.y *= 6.0 → floor → random1d
 *       sample = texture(uTexture, uv + vec2(deformLine, 0.0) * uIntensity)
 *  4. uIntensity を 0 → 1 → 0 で GSAP アニメ。peak で navigate。
 *  5. astro:after-swap で新しいページをもう一度スナップショットしてテクスチャ差し替え
 *  6. 0 に戻り切ったら canvas を片付ける
 *
 * deform は image texture のサンプリングだけなので、SVG filter のように DOM を
 * 再ラスタライズするコストがかからない。重い WebGL コンテンツがあるページでも軽い。
 */

const VERTEX = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

const FRAGMENT = /* glsl */ `
    precision highp float;
    uniform sampler2D uTexture;
    uniform float uIntensity;
    varying vec2 vUv;

    float random1d(float y) {
        return fract(sin(y) * 43758.5453);
    }

    void main() {
        vec2 uv = vUv;
        // 記事と同じ: 6 領域に floor して行ごとに 0..1 の乱数
        float row = floor(vUv.y * 6.0);
        float deformLine = random1d(row);
        // 0..1 のままだと一方向にしかずれないので -1..1 に展開してから intensity を掛ける
        float shift = (deformLine - 0.5) * 2.0 * uIntensity;
        vec2 sampleUv = vec2(vUv.x + shift, vUv.y);
        // 端は clamp してテクスチャ外を読まないように
        sampleUv = clamp(sampleUv, vec2(0.0), vec2(1.0));
        gl_FragColor = texture2D(uTexture, sampleUv);
    }
`;

const PEAK_INTENSITY = 0.25; // shift 量 (vUv 単位、画面幅の 25%)

export const WebGLTransition: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const stateRef = useRef<{
        renderer?: THREE.WebGLRenderer;
        scene?: THREE.Scene;
        camera?: THREE.OrthographicCamera;
        material?: THREE.ShaderMaterial;
        texture?: THREE.Texture;
        canvas?: HTMLCanvasElement;
        rafId?: number | null;
        rendering?: boolean;
    }>({});

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        const canvas = renderer.domElement;
        canvas.style.cssText = [
            'position:fixed',
            'inset:0',
            'width:100vw',
            'height:100vh',
            'z-index:9999',
            'pointer-events:none',
            'display:none',
        ].join(';');
        container.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const texture = new THREE.Texture();
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uIntensity: { value: 0 },
            },
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            transparent: true,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(mesh);

        const onResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight, false);
        };
        window.addEventListener('resize', onResize);

        Object.assign(stateRef.current, {
            renderer,
            scene,
            camera,
            material,
            texture,
            canvas,
            rafId: null,
            rendering: false,
        });

        return () => {
            window.removeEventListener('resize', onResize);
            const s = stateRef.current;
            if (s.rafId != null) cancelAnimationFrame(s.rafId);
            mesh.geometry.dispose();
            material.dispose();
            texture.dispose();
            renderer.dispose();
            if (canvas.parentNode === container) container.removeChild(canvas);
            stateRef.current = {};
        };
    }, []);

    useEffect(() => {
        const startRender = () => {
            const s = stateRef.current;
            if (s.rendering) return;
            s.rendering = true;
            const tick = () => {
                if (!s.rendering) return;
                s.renderer?.render(s.scene!, s.camera!);
                s.rafId = requestAnimationFrame(tick);
            };
            s.rafId = requestAnimationFrame(tick);
        };

        const stopRender = () => {
            const s = stateRef.current;
            s.rendering = false;
            if (s.rafId != null) cancelAnimationFrame(s.rafId);
            s.rafId = null;
        };

        const captureToTexture = async (): Promise<boolean> => {
            const root = document.getElementById('page-root') ?? document.body;
            try {
                const dataUrl = await toPng(root, {
                    pixelRatio: 1,
                    cacheBust: false,
                    skipFonts: true, // フォント外部参照のフェッチをスキップして高速化
                });
                const img = new Image();
                img.src = dataUrl;
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('image load failed'));
                });
                const tex = stateRef.current.texture;
                if (!tex) return false;
                tex.image = img;
                tex.needsUpdate = true;
                return true;
            } catch (err) {
                console.warn('[WebGLTransition] snapshot failed', err);
                return false;
            }
        };

        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.4;
            const revealDuration = detail.revealDuration ?? 0.4;

            const s = stateRef.current;
            const material = s.material;
            const canvas = s.canvas;
            if (!material || !canvas) return;

            tlRef.current?.kill();

            void (async () => {
                // 1) 現ページをキャプチャしてテクスチャに焼き込む
                const ok = await captureToTexture();
                if (!ok) {
                    // フォールバック: スナップショット失敗 → 何もせず素直に navigate
                    if (detail.url) void navigate(detail.url);
                    return;
                }

                // 2) overlay を表示してレンダ開始。同時に元ページは非表示にしてダブり防止
                canvas.style.display = 'block';
                const root = document.getElementById('page-root');
                if (root) root.style.visibility = 'hidden';
                material.uniforms.uIntensity.value = 0;
                startRender();

                // 3) Cover: intensity 0 → 1
                const tl = gsap.timeline({
                    onComplete: () => {
                        // 4) クリーンアップ
                        canvas.style.display = 'none';
                        const r = document.getElementById('page-root');
                        if (r) r.style.visibility = '';
                        stopRender();
                    },
                });

                tl.to(material.uniforms.uIntensity, {
                    value: 1,
                    duration: coverDuration,
                    ease: 'power2.in',
                });

                // 5) navigate → astro:after-swap で新ページを再キャプチャ → reveal
                tl.add(() => {
                    if (detail.url) void navigate(detail.url);
                });
                tl.addPause();

                tl.to(material.uniforms.uIntensity, {
                    value: 0,
                    duration: revealDuration,
                    ease: 'power2.out',
                });

                tlRef.current = tl;

                // after-swap で resume (新ページの DOM を再キャプチャしてテクスチャ差し替え)
                let resumed = false;
                const resume = async () => {
                    if (resumed) return;
                    resumed = true;
                    document.removeEventListener('astro:after-swap', resume);
                    clearTimeout(fallback);
                    // 新ページの DOM が見えないと html-to-image が空を撮るので一瞬だけ
                    // visibility を戻してキャプチャ → 再度隠す
                    const r = document.getElementById('page-root');
                    if (r) r.style.visibility = '';
                    // 1 frame 待って layout が安定してからキャプチャ
                    await new Promise((res) => requestAnimationFrame(() => res(null)));
                    await captureToTexture();
                    if (r) r.style.visibility = 'hidden';
                    tl.resume();
                };
                const fallback = window.setTimeout(() => void resume(), 1500);
                if (detail.url) {
                    document.addEventListener('astro:after-swap', () => void resume(), { once: true });
                } else {
                    void resume();
                }
            })();
        };

        window.addEventListener(TRANSITION_EVENT, handlePlay);
        return () => {
            window.removeEventListener(TRANSITION_EVENT, handlePlay);
            tlRef.current?.kill();
            stopRender();
        };
    }, []);

    return <div ref={containerRef} aria-hidden="true" style={{ display: 'contents' }} />;
};

export default WebGLTransition;
