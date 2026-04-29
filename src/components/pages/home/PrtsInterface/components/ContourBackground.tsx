import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { contourVertex, contourFragment } from '../shaders/contour';

interface Props {
    /** イントロアニメをスキップする (sessionStorage 由来) */
    skipIntro: boolean;
}

const TARGET_OPACITY = 0.16;
const FADE_IN_DURATION_S = 1.4;
const FADE_IN_DELAY_S = 3.4; // MAIN_TITLE_TIMING_MS.cameraZoomOutStart と同じタイミングで滑り込ませる

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

const ContourScene: React.FC<{ skipIntro: boolean; reducedMotion: boolean }> = ({
    skipIntro,
    reducedMotion,
}) => {
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const { size, viewport } = useThree();
    const elapsedRef = useRef(0);

    const lineColor = useMemo(readForegroundColor, []);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(1, 1) },
            uLineColor: { value: lineColor },
            uOpacity: { value: skipIntro || reducedMotion ? TARGET_OPACITY : 0 },
            uLineWidth: { value: 0.42 },
            uBands: { value: 11 },
            uScale: { value: 2.6 },
            uSpeed: { value: reducedMotion ? 0 : 0.045 },
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
    const [reducedMotion, setReducedMotion] = useState(false);
    const [contextLost, setContextLost] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    if (contextLost) return null;

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ zIndex: 0 }}
        >
            <Canvas
                orthographic
                gl={{ alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                frameloop={reducedMotion ? 'demand' : 'always'}
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
                <ContourScene skipIntro={skipIntro} reducedMotion={reducedMotion} />
            </Canvas>
        </div>
    );
};

export default ContourBackground;
