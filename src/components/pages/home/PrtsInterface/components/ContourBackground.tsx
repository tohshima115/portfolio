import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { contourVertex, contourFragment } from '../shaders/contour';

interface Props {
    /** イントロアニメをスキップする (sessionStorage 由来) */
    skipIntro: boolean;
}

const TARGET_OPACITY = 0.42;
const FADE_IN_DURATION_S = 1.4;
const FADE_IN_DELAY_S = 3.4; // MAIN_TITLE_TIMING_MS.cameraZoomOutStart と同じタイミングで滑り込ませる
// uSpeed が極めて遅いのでフレーム間差分は視覚的に区別できない。24fps まで落としても劣化なし。
const TARGET_FPS = 24;

const readForegroundColor = (): THREE.Color => {
    if (typeof window === 'undefined') return new THREE.Color('#0a0a0a');
    try {
        const probe = document.createElement('div');
        probe.style.color = 'var(--color-foreground, #0a0a0a)';
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.pointerEvents = 'none';
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        document.body.removeChild(probe);
        return new THREE.Color().setStyle(resolved);
    } catch {
        return new THREE.Color('#0a0a0a');
    }
};

const ContourScene: React.FC<{ skipIntro: boolean; reducedMotion: boolean; inView: boolean }> = ({
    skipIntro,
    reducedMotion,
    inView,
}) => {
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const { size, viewport, invalidate } = useThree();
    const elapsedRef = useRef(0);

    // frameloop="demand" の Canvas を rAF + delta 蓄積で TARGET_FPS にスロットル。
    // setInterval と違い、タブ非表示時は rAF が自動で止まるのでバッテリーにも優しい。
    // hero が画面外になっている間 (inView=false) はループ自体を張らない。
    useEffect(() => {
        if (reducedMotion || !inView) return;
        const interval = 1000 / TARGET_FPS;
        let raf = 0;
        let last = performance.now();
        let acc = 0;
        const tick = (now: number) => {
            acc += now - last;
            last = now;
            if (acc >= interval) {
                acc -= interval;
                if (acc > interval) acc = 0; // 大きな遅延後にバーストさせない
                invalidate();
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [invalidate, reducedMotion, inView]);

    const lineColor = useMemo(readForegroundColor, []);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(1, 1) },
            uLineColor: { value: lineColor },
            uOpacity: { value: skipIntro || reducedMotion ? TARGET_OPACITY : 0 },
            uLineWidth: { value: 0.5 },
            uBands: { value: 28 },
            uScale: { value: 2.4 },
            uSpeed: { value: reducedMotion ? 0 : 0.006 },
        }),
        // 初期化のみで上書き不要
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        const mat = materialRef.current;
        if (!mat) return;
        mat.uniforms.uResolution.value.set(size.width, size.height);
    }, [size.width, size.height, viewport.dpr]);

    useFrame((_state, delta) => {
        const mat = materialRef.current;
        if (!mat) return;
        if (!reducedMotion) {
            mat.uniforms.uTime.value += delta;
        }
        // フェードイン (skipIntro / reduced-motion 時はすでに最大値)
        if (!skipIntro && !reducedMotion) {
            elapsedRef.current += delta;
            const t = Math.max(0, elapsedRef.current - FADE_IN_DELAY_S) / FADE_IN_DURATION_S;
            const eased = Math.min(1, t < 0 ? 0 : 1 - Math.pow(1 - t, 3));
            mat.uniforms.uOpacity.value = eased * TARGET_OPACITY;
        }
    });

    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={uniforms}
                vertexShader={contourVertex}
                fragmentShader={contourFragment}
                transparent
                depthTest={false}
                depthWrite={false}
            />
        </mesh>
    );
};

export const ContourBackground: React.FC<Props> = ({ skipIntro }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [contextLost, setContextLost] = useState(false);
    const [inView, setInView] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    // hero がスクロールで画面外に抜けたらアニメーションを止める。
    // hero 自体は h-screen なので、スクロールダウンで完全に外れる。
    useEffect(() => {
        const target = containerRef.current;
        if (!target || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0 },
        );
        io.observe(target);
        return () => io.disconnect();
    }, []);

    if (contextLost) return null;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ zIndex: 0 }}
        >
            <Canvas
                orthographic
                gl={{ alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' }}
                dpr={1}
                frameloop="demand"
                style={{ width: '100%', height: '100%' }}
                onCreated={({ gl }) => {
                    const canvas = gl.domElement;
                    const handleLost = (e: Event) => {
                        e.preventDefault();
                        setContextLost(true);
                    };
                    canvas.addEventListener('webglcontextlost', handleLost, { once: true });
                }}
            >
                <ContourScene skipIntro={skipIntro} reducedMotion={reducedMotion} inView={inView} />
            </Canvas>
        </div>
    );
};

export default ContourBackground;
