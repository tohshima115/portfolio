import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';

// 「Cloudflare の TOP みたいな地球儀 + ネットワーク」を SF 工業トーンで再構成。
// - wireframe sphere (foreground 色 / 低 opacity)
// - PoP 候補 15 都市の小ドット (accent 色)
// - 同時に 5 本の arc が常時走っており、phase 0..0.5 で伸び、0.5..1.0 で消える
// - 1 本完了したら別の都市ペアへリスポーン

const POPS: { lat: number; lng: number }[] = [
    { lat: 35.7, lng: 139.7 },   // Tokyo
    { lat: 1.3, lng: 103.8 },    // Singapore
    { lat: 51.5, lng: -0.1 },    // London
    { lat: 40.7, lng: -74.0 },   // New York
    { lat: 37.8, lng: -122.4 },  // San Francisco
    { lat: -33.9, lng: 151.2 },  // Sydney
    { lat: 52.5, lng: 13.4 },    // Berlin
    { lat: 28.6, lng: 77.2 },    // Delhi
    { lat: -23.5, lng: -46.6 },  // São Paulo
    { lat: 19.4, lng: -99.1 },   // Mexico City
    { lat: 30.0, lng: 31.2 },    // Cairo
    { lat: 55.8, lng: 37.6 },    // Moscow
    { lat: 22.3, lng: 114.2 },   // Hong Kong
    { lat: -26.2, lng: 28.0 },   // Johannesburg
    { lat: 41.0, lng: 28.9 },    // Istanbul
];

const sphericalToVector3 = (lat: number, lng: number, r: number = 1): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
    );
};

const POP_VECTORS = POPS.map((p) => sphericalToVector3(p.lat, p.lng, 1));

const readCssColor = (variable: string, fallback: string): string => {
    if (typeof window === 'undefined') return fallback;
    try {
        const probe = document.createElement('div');
        probe.style.color = `var(${variable})`;
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.pointerEvents = 'none';
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).color;
        document.body.removeChild(probe);
        return c;
    } catch {
        return fallback;
    }
};

const ARC_COUNT = 5;
const ARC_RESOLUTION = 64;
const ARC_TOTAL_POINTS = ARC_RESOLUTION + 1;

interface ArcState {
    fromIdx: number;
    toIdx: number;
    phase: number;
    duration: number;
}

const randomArc = (excludeFromIdx: number = -1): ArcState => {
    let fromIdx = Math.floor(Math.random() * POP_VECTORS.length);
    if (excludeFromIdx >= 0) {
        fromIdx =
            (excludeFromIdx +
                1 +
                Math.floor(Math.random() * (POP_VECTORS.length - 1))) %
            POP_VECTORS.length;
    }
    let toIdx = Math.floor(Math.random() * POP_VECTORS.length);
    while (toIdx === fromIdx) {
        toIdx = Math.floor(Math.random() * POP_VECTORS.length);
    }
    return {
        fromIdx,
        toIdx,
        phase: 0,
        duration: 2.0 + Math.random() * 1.5,
    };
};

interface ArcLineProps {
    stateRef: React.MutableRefObject<ArcState>;
    color: string;
}

const ArcLine: React.FC<ArcLineProps> = ({ stateRef, color }) => {
    const lastIdsRef = useRef<{ fromIdx: number; toIdx: number } | null>(null);

    const lineObject = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(ARC_TOTAL_POINTS * 3);
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3),
        );
        geometry.setDrawRange(0, 0);
        const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0,
        });
        return new THREE.Line(geometry, material);
    }, [color]);

    useEffect(() => {
        return () => {
            lineObject.geometry.dispose();
            (lineObject.material as THREE.LineBasicMaterial).dispose();
        };
    }, [lineObject]);

    useFrame((_, dt) => {
        const state = stateRef.current;

        // endpoints が変わったら geometry の座標を書き換え (再 alloc しない)
        if (
            !lastIdsRef.current ||
            lastIdsRef.current.fromIdx !== state.fromIdx ||
            lastIdsRef.current.toIdx !== state.toIdx
        ) {
            const from = POP_VECTORS[state.fromIdx];
            const to = POP_VECTORS[state.toIdx];
            const liftAmount = 1.22 + from.distanceTo(to) * 0.18;
            const mid = from
                .clone()
                .add(to)
                .multiplyScalar(0.5)
                .normalize()
                .multiplyScalar(liftAmount);
            const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
            const points = curve.getPoints(ARC_RESOLUTION);
            const positionAttr = lineObject.geometry.attributes
                .position as THREE.BufferAttribute;
            for (let i = 0; i < points.length; i++) {
                positionAttr.setXYZ(i, points[i].x, points[i].y, points[i].z);
            }
            positionAttr.needsUpdate = true;
            lineObject.geometry.computeBoundingSphere();
            lastIdsRef.current = {
                fromIdx: state.fromIdx,
                toIdx: state.toIdx,
            };
        }

        // phase advance + respawn
        state.phase += dt / state.duration;
        if (state.phase >= 1) {
            const next = randomArc(state.toIdx);
            state.fromIdx = next.fromIdx;
            state.toIdx = next.toIdx;
            state.phase = 0;
            state.duration = next.duration;
        }

        // drawRange: 0..0.5 で伸びる、0.5..1.0 で fade out
        const phase = state.phase;
        let drawCount: number;
        let opacity: number;
        if (phase <= 0.5) {
            drawCount = Math.max(
                2,
                Math.floor((phase / 0.5) * ARC_TOTAL_POINTS),
            );
            // 立ち上がり中も最初の数フレームだけ薄くしたい (ぱっと出ないように)
            opacity = Math.min(0.9, phase * 6);
        } else {
            drawCount = ARC_TOTAL_POINTS;
            opacity = 0.9 * (1 - (phase - 0.5) / 0.5);
        }
        lineObject.geometry.setDrawRange(0, drawCount);
        (lineObject.material as THREE.LineBasicMaterial).opacity = opacity;
    });

    return <primitive object={lineObject} />;
};

interface GlobeProps {
    accentColor: string;
    foreColor: string;
    reduced: boolean;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const Globe: React.FC<GlobeProps> = ({ accentColor, foreColor, reduced }) => {
    const groupRef = useRef<THREE.Group>(null);
    const startTimeRef = useRef<number | null>(null);

    const popPositions = useMemo(() => {
        const arr = new Float32Array(POP_VECTORS.length * 3);
        POP_VECTORS.forEach((v, i) => {
            arr[i * 3] = v.x * 1.005;
            arr[i * 3 + 1] = v.y * 1.005;
            arr[i * 3 + 2] = v.z * 1.005;
        });
        return arr;
    }, []);

    const sphereGeometry = useMemo(
        () => new THREE.SphereGeometry(1, 28, 18),
        [],
    );
    useEffect(() => () => sphereGeometry.dispose(), [sphereGeometry]);

    const arcStates = useMemo(() => {
        return Array.from({ length: ARC_COUNT }, () => randomArc());
    }, []);
    const arcRefs = useMemo(
        () => arcStates.map((s) => ({ current: s })),
        [arcStates],
    );
    // 開始時に phase をずらして同期発火を避ける
    useEffect(() => {
        arcRefs.forEach((r, i) => {
            r.current.phase = (i / ARC_COUNT) * 0.9;
        });
    }, [arcRefs]);

    useFrame((state, dt) => {
        if (!groupRef.current) return;
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }
        if (!reduced) {
            // 連続 rotation
            groupRef.current.rotation.y += dt * 0.06; // ~17 sec / rotation
            // 立ち上がり (1.6s で 0.88 → 1.0 の dolly-in)
            const t = Math.min(
                1,
                (state.clock.elapsedTime - startTimeRef.current) / 1.6,
            );
            const s = 0.88 + (1 - 0.88) * easeOutCubic(t);
            groupRef.current.scale.setScalar(s);
        } else {
            groupRef.current.scale.setScalar(1);
        }
    });

    return (
        <group ref={groupRef} rotation={[0.32, 0, 0]}>
            {/* wireframe sphere */}
            <mesh geometry={sphereGeometry}>
                <meshBasicMaterial
                    color={foreColor}
                    wireframe
                    transparent
                    opacity={0.14}
                />
            </mesh>

            {/* PoP points */}
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[popPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color={accentColor}
                    size={0.045}
                    sizeAttenuation
                    transparent
                    opacity={0.95}
                />
            </points>

            {/* arcs (reduced-motion ではアニメ自体を出さない) */}
            {!reduced &&
                arcRefs.map((ref, i) => (
                    <ArcLine key={i} stateRef={ref} color={accentColor} />
                ))}
        </group>
    );
};

interface Props {
    className?: string;
}

export const GlobeBackground: React.FC<Props> = ({ className }) => {
    const reduced = useReducedMotion();
    const [mounted, setMounted] = useState(false);
    const [accentColor, setAccentColor] = useState('#4c8bf5');
    const [foreColor, setForeColor] = useState('#0a0a0a');

    useEffect(() => {
        setMounted(true);
        setAccentColor(readCssColor('--color-accent', '#4c8bf5'));
        setForeColor(readCssColor('--color-foreground', '#0a0a0a'));
    }, []);

    if (!mounted) {
        return <div className={className} aria-hidden />;
    }

    return (
        <div className={className} aria-hidden>
            <Canvas
                camera={{ position: [0, 0, 3.2], fov: 36 }}
                dpr={[1, 1.5]}
                frameloop="always"
                gl={{ antialias: true, alpha: true }}
            >
                <Globe
                    accentColor={accentColor}
                    foreColor={foreColor}
                    reduced={reduced}
                />
            </Canvas>
        </div>
    );
};
