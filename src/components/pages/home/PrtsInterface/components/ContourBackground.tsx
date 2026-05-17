import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { type MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { contourVertex, contourFragment } from '../shaders/contour';

interface Props {
    /**
     * 0..1 の「乱れ」係数。Hero→Statement 遷移演出 (案 A) で進捗連動して
     * shader の uChaos uniform を動かす。
     * MotionValue を渡せば購読 + invalidate で frameloop="demand" に乗る。
     * 数値で渡せば mount 時に固定値として set。
     * 渡さないと 0 (= 現状の Hero 単体表示) で完全に既存挙動を維持。
     */
    chaos?: MotionValue<number> | number;
}

const TARGET_OPACITY = 0.26;
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

const ContourScene: React.FC<{
    reducedMotion: boolean;
    inView: boolean;
    chaos?: MotionValue<number> | number;
}> = ({ reducedMotion, inView, chaos }) => {
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const { size, viewport, invalidate } = useThree();

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
            uOpacity: { value: TARGET_OPACITY },
            uLineWidth: { value: 0.5 },
            uBands: { value: 28 },
            uScale: { value: 2.4 },
            uSpeed: { value: reducedMotion ? 0 : 0.006 },
            uChaos: { value: 0 },
        }),
        // 初期化のみで上書き不要
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    // chaos: MotionValue または数値を受け取り uChaos uniform に反映。
    // frameloop="demand" なので変化のたびに明示的に invalidate() で再描画。
    useEffect(() => {
        const mat = materialRef.current;
        if (!mat) return;
        if (chaos === undefined) {
            mat.uniforms.uChaos.value = 0;
            invalidate();
            return;
        }
        if (typeof chaos === 'number') {
            mat.uniforms.uChaos.value = chaos;
            invalidate();
            return;
        }
        // MotionValue
        mat.uniforms.uChaos.value = chaos.get();
        invalidate();
        const unsub = chaos.on('change', (v: number) => {
            mat.uniforms.uChaos.value = v;
            invalidate();
        });
        return () => unsub();
    }, [chaos, invalidate]);

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

export const ContourBackground: React.FC<Props> = ({ chaos }) => {
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
                // 親に CSS transform (perspective + rotateX + scale) が乗ると
                // 既定の getBoundingClientRect 経由の auto-resize が post-projection
                // AABB を読んで canvas を不当に拡大する。offsetSize は CSS transform
                // の影響を受けない offsetWidth/Height を使うので、親 wrapper で
                // transform を一括管理できるようになる。
                resize={{ offsetSize: true }}
                style={{ width: '100%', height: '100%' }}
                onCreated={({ gl }) => {
                    const canvas = gl.domElement;
                    const handleLost = (e: Event) => {
                        e.preventDefault();
                        setContextLost(true);
                    };
                    canvas.addEventListener('webglcontextlost', handleLost, { once: true });
                    // 初期化完了 (WebGL Context 作成 + シェーダーコンパイル完了) を window 経由で通知。
                    // 現状 HomeIntro 側ではこの event を listen していないが、将来 HeroSection を
                    // 常時 mount して「等高線初期化完了を待ってから bootDone」に切り替えるとき
                    // のための検知 hook として仕込んでおく。
                    if (typeof window !== 'undefined') {
                        try {
                            window.dispatchEvent(new CustomEvent('home-contour-ready'));
                        } catch {
                            /* ignore */
                        }
                    }
                }}
            >
                <ContourScene
                    reducedMotion={reducedMotion}
                    inView={inView}
                    chaos={chaos}
                />
            </Canvas>
        </div>
    );
};

export default ContourBackground;
