import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    if (!CustomEase.get('hop')) {
        CustomEase.create('hop', '0.56, 0, 0.35, 0.98');
    }
}

/**
 * 遷移オーバーレイ (Three.js + GlitchPass + 方向付きワイプ)。
 *
 * Pipeline: RenderPass → GlitchPass → DirectionalWipePass → OutputPass
 *
 * - 暗色のフルスクリーンクワッドを RenderPass で描画
 * - GlitchPass (goWild=true) で全体にグリッチを乗せる
 * - DirectionalWipePass は `progress` (0..1) と `dir` (+1/-1) で
 *   uv.x を行ごとにランダム速度でしきい値スイープし、cover 面を一方向から
 *   伸びてくるように見せる。先頭エッジは smoothstep でソフトフェード。
 * - cover phase: progress 0→1 (右側から左へ glitch 帯がなだれ込む)
 * - hold 中に navigate → astro:after-swap 待ち
 * - reveal phase: progress 1→0 (同じ右側へ glitch 帯が引き戻される)
 */

const wipeShader = {
    uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        progress: { value: 0 },
        dir: { value: 1 },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float progress;
        uniform float dir;
        varying vec2 vUv;

        float hash11(float p) {
            p = fract(p * 0.1031);
            p *= p + 33.33;
            p *= p + p;
            return fract(p);
        }

        void main() {
            vec4 c = texture2D(tDiffuse, vUv);

            // 行ごとのスピード倍率 (0.55〜1.0)
            float row = floor(vUv.y * 90.0);
            float r = 0.55 + hash11(row) * 0.45;

            float coverP = clamp(progress * r * 1.3, 0.0, 1.0);
            // dir = +1: cover は右から押し寄せる (threshold が 1→0)
            float threshold = dir > 0.0 ? (1.0 - coverP) : coverP;

            // 先頭エッジからの距離。dir が逆向きなら符号反転
            float distFromEdge = dir > 0.0 ? (vUv.x - threshold) : (threshold - vUv.x);

            if (distFromEdge <= 0.0) {
                discard;
            }

            // 先頭 ~3% を soft edge にしてストリークの余韻を作る
            float edgeFade = smoothstep(0.0, 0.03, distFromEdge);

            gl_FragColor = vec4(c.rgb, c.a * edgeFade);
        }
    `,
};

export const WebGLTransition: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
    const glitchRef = useRef<GlitchPass | null>(null);
    const wipePassRef = useRef<ShaderPass | null>(null);
    const rafRef = useRef<number | null>(null);
    const runningRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // --- Three.js セットアップ ---
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        renderer.setClearColor(0x000000, 0);
        const canvas = renderer.domElement;
        canvas.style.cssText = [
            'position:fixed',
            'inset:0',
            'width:100vw',
            'height:100vh',
            'z-index:9999',
            'pointer-events:none',
        ].join(';');
        container.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const geometry = new THREE.PlaneGeometry(2, 2);
        // material 自体は常に opacity=1 で描画。表示/非表示は wipePass の
        // progress uniform でコントロールする。
        const material = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 1,
        });
        const quad = new THREE.Mesh(geometry, material);
        scene.add(quad);

        // --- EffectComposer + GlitchPass ---
        const composer = new EffectComposer(renderer);
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const renderPass = new RenderPass(scene, camera);
        // RenderPass はデフォルトで毎回 clear するが、alpha を活かしたいので
        // 明示的に clear color を透過にする
        renderPass.clearColor = new THREE.Color(0x000000);
        renderPass.clearAlpha = 0;
        composer.addPass(renderPass);

        const glitch = new GlitchPass();
        glitch.goWild = true; // 常時グリッチ
        composer.addPass(glitch);

        const wipePass = new ShaderPass(wipeShader);
        composer.addPass(wipePass);

        composer.addPass(new OutputPass());

        rendererRef.current = renderer;
        composerRef.current = composer;
        sceneRef.current = scene;
        materialRef.current = material;
        glitchRef.current = glitch;
        wipePassRef.current = wipePass;

        // --- Resize 対応 ---
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.setSize(w, h, false);
            composer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            runningRef.current = false;
            tlRef.current?.kill();
            try {
                composer.dispose();
            } catch {
                /* noop */
            }
            try {
                geometry.dispose();
                material.dispose();
                renderer.dispose();
            } catch {
                /* noop */
            }
            if (canvas.parentNode === container) {
                container.removeChild(canvas);
            }
            rendererRef.current = null;
            composerRef.current = null;
            sceneRef.current = null;
            materialRef.current = null;
            glitchRef.current = null;
            wipePassRef.current = null;
        };
    }, []);

    useEffect(() => {
        const startRenderLoop = () => {
            if (runningRef.current) return;
            runningRef.current = true;
            const tick = () => {
                if (!runningRef.current) return;
                composerRef.current?.render();
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        };

        const stopRenderLoop = () => {
            runningRef.current = false;
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };

        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.7;
            const revealDuration = detail.revealDuration ?? 0.6;

            const wipePass = wipePassRef.current;
            if (!wipePass) return;

            tlRef.current?.kill();

            // 初期化: progress=0 (透明) / dir=+1 (右側から sweep)
            wipePass.uniforms.progress.value = 0;
            wipePass.uniforms.dir.value = 1;
            startRenderLoop();

            const tl = gsap.timeline({
                onComplete: () => {
                    stopRenderLoop();
                },
            });

            // --- Cover: progress 0 → 1 (右側から glitch 帯が sweep してくる) ---
            tl.to(wipePass.uniforms.progress, {
                value: 1,
                duration: coverDuration,
                ease: 'hop',
            });

            // --- Hold: navigate → after-swap 待ち ---
            tl.add(() => {
                if (detail.url) void navigate(detail.url);
            });
            tl.addPause();

            // --- Reveal: progress 1 → 0 (同じ側へ引き戻して新ページが現れる) ---
            tl.to(wipePass.uniforms.progress, {
                value: 0,
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
        };
    }, []);

    return <div ref={containerRef} aria-hidden="true" style={{ display: 'contents' }} />;
};

export default WebGLTransition;
