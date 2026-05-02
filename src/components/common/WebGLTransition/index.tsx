import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
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
 * 遷移オーバーレイ (Three.js + GlitchPass)。
 *
 * - フルスクリーンの WebGLRenderer を 1 枚走らせ、暗色のフルスクリーンクワッドを
 *   不透明度でフェードイン/アウトさせる
 * - 上にかかる EffectComposer の GlitchPass (goWild = true) で常時グリッチ
 * - 不透明度 0→1 (cover): 画面が glitch しながら覆われる
 * - hold 中に navigate、`astro:after-swap` を待って DOM 入替
 * - 不透明度 1→0 (reveal): 新ページが現れる
 *
 * 通常時は不透明度 0 で render loop も停止しているので、トランジション中以外は
 * GPU コストゼロ。
 */

export const WebGLTransition: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
    const glitchRef = useRef<GlitchPass | null>(null);
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
        const material = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0,
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

        composer.addPass(new OutputPass());

        rendererRef.current = renderer;
        composerRef.current = composer;
        sceneRef.current = scene;
        materialRef.current = material;
        glitchRef.current = glitch;

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

            const material = materialRef.current;
            if (!material) return;

            tlRef.current?.kill();

            // 初期化
            material.opacity = 0;
            startRenderLoop();

            const tl = gsap.timeline({
                onComplete: () => {
                    stopRenderLoop();
                },
            });

            // --- Cover: opacity 0 → 1 (画面が glitch しながら覆われる) ---
            tl.to(material, {
                opacity: 1,
                duration: coverDuration,
                ease: 'hop',
            });

            // --- Hold: navigate → after-swap 待ち ---
            tl.add(() => {
                if (detail.url) void navigate(detail.url);
            });
            tl.addPause();

            // --- Reveal: opacity 1 → 0 (新ページが現れる) ---
            tl.to(material, {
                opacity: 0,
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
