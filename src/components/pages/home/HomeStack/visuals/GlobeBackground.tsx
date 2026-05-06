import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { useReducedMotion } from '../hooks/useReducedMotion';

// 「Cloudflare の TOP みたいな地球儀 + ネットワーク」を SF 工業トーンで再構成。
// - wireframe sphere (foreground 色 / 低 opacity)
// - 同時に 5 本の arc が常時走っており、phase 0..0.5 で伸び、0.5..1.0 で消える
// - 1 本完了したら別の都市ペアへリスポーン
//
// 「Cloudflare 感」を最優先するため、arc は theme accent ではなく
// Cloudflare ブランドオレンジ (#F38020) を直接使う。
//
// 都市は POP_VECTORS として保持するが、ドット描画はせず arc の起点/終点としてだけ参照する。

const CLOUDFLARE_ORANGE = '#F38020';

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

const ARC_COUNT = 5;
const ARC_RESOLUTION = 64;
const ARC_TOTAL_POINTS = ARC_RESOLUTION + 1;
const ARC_TOTAL_SEGMENTS = ARC_TOTAL_POINTS - 1;
const ARC_LINEWIDTH_PX = 2.5;

// 起点と終点が短すぎる arc は「ちょっと光ってすぐ消える点」になって絵にならないので、
// 弦長 (= 球面 chord 長) が一定以上のペアだけ採用する。
// 1.0 = 球面上 60° の角距離 (e.g., 東京〜デリー級) 以上。
const MIN_ARC_CHORD = 1.0;

interface ArcState {
    fromIdx: number;
    toIdx: number;
    phase: number;
    duration: number;
}

const randomArc = (excludeFromIdx: number = -1): ArcState => {
    let fromIdx = 0;
    let toIdx = 0;
    let attempts = 0;
    do {
        fromIdx =
            excludeFromIdx >= 0
                ? (excludeFromIdx +
                      1 +
                      Math.floor(Math.random() * (POP_VECTORS.length - 1))) %
                  POP_VECTORS.length
                : Math.floor(Math.random() * POP_VECTORS.length);
        toIdx = Math.floor(Math.random() * POP_VECTORS.length);
        attempts++;
    } while (
        (toIdx === fromIdx ||
            POP_VECTORS[fromIdx].distanceTo(POP_VECTORS[toIdx]) < MIN_ARC_CHORD) &&
        attempts < 50
    );
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

// arc は WebGL の gl.LINES (1px 固定) ではなく Line2 (shader-based、ピクセル幅指定可) で描画。
// 「instanceCount を可変にして growing arc」を実現する: LineGeometry は内部的に
// InstancedBufferGeometry で各 segment が 1 instance なので、instanceCount を絞ると
// 先頭から N 本までだけ描画される。
const ArcLine: React.FC<ArcLineProps> = ({ stateRef, color }) => {
    const lastIdsRef = useRef<{ fromIdx: number; toIdx: number } | null>(null);
    const { size } = useThree();

    const lineObject = useMemo(() => {
        const geometry = new LineGeometry();
        // pre-allocate: ARC_TOTAL_POINTS 個の点 (= ARC_TOTAL_SEGMENTS 本の segment)
        const initial = new Array(ARC_TOTAL_POINTS * 3).fill(0);
        geometry.setPositions(initial);
        geometry.instanceCount = 0;
        const material = new LineMaterial({
            color: new THREE.Color(color),
            linewidth: ARC_LINEWIDTH_PX,
            transparent: true,
            opacity: 0,
            depthTest: true,
            depthWrite: false,
        });
        return new Line2(geometry, material);
    }, [color]);

    useEffect(() => {
        return () => {
            lineObject.geometry.dispose();
            (lineObject.material as LineMaterial).dispose();
        };
    }, [lineObject]);

    // Line2 のピクセル幅は material.resolution = (canvas size) を必要とする
    useEffect(() => {
        const mat = lineObject.material as LineMaterial;
        mat.resolution.set(size.width, size.height);
    }, [lineObject, size.width, size.height]);

    useFrame((_, dt) => {
        const state = stateRef.current;
        const lineGeo = lineObject.geometry as LineGeometry;
        const mat = lineObject.material as LineMaterial;

        // endpoints が変わったら polyline の頂点を書き換え (full curve 分セット)
        if (
            !lastIdsRef.current ||
            lastIdsRef.current.fromIdx !== state.fromIdx ||
            lastIdsRef.current.toIdx !== state.toIdx
        ) {
            const from = POP_VECTORS[state.fromIdx];
            const to = POP_VECTORS[state.toIdx];
            // sphere 半径 1.0 + camera フレーミング (z=4.2, fov 40°, half-height ~1.53) で
            // 余裕を持って端切れしないよう arc 最大持ち上がりを ~1.20 に抑える。
            const liftAmount = 1.10 + from.distanceTo(to) * 0.05;
            const mid = from
                .clone()
                .add(to)
                .multiplyScalar(0.5)
                .normalize()
                .multiplyScalar(liftAmount);
            const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
            const points = curve.getPoints(ARC_RESOLUTION);
            const flat: number[] = [];
            for (const p of points) flat.push(p.x, p.y, p.z);
            lineGeo.setPositions(flat);
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

        // 0..0.5 で伸びる (instanceCount を増やす)、0.5..1.0 で fade out
        const phase = state.phase;
        let segments: number;
        let opacity: number;
        if (phase <= 0.5) {
            segments = Math.max(
                1,
                Math.floor((phase / 0.5) * ARC_TOTAL_SEGMENTS),
            );
            opacity = Math.min(0.9, phase * 6);
        } else {
            segments = ARC_TOTAL_SEGMENTS;
            opacity = 0.9 * (1 - (phase - 0.5) / 0.5);
        }
        lineGeo.instanceCount = segments;
        mat.opacity = opacity;
    });

    return <primitive object={lineObject} />;
};

interface GlobeProps {
    reduced: boolean;
}

const Globe: React.FC<GlobeProps> = ({ reduced }) => {
    const groupRef = useRef<THREE.Group>(null);

    // 表面塗り用の solid sphere (半径 1.0) と、その外側に被せる wireframe (半径 1.015)。
    // EdgesGeometry (threshold 1°) で四角格子の外枠だけ抽出。
    //
    // wire 半径と subdivision の根拠:
    //   wire の line は 2 頂点を結ぶ "直線 chord" なので、中点は球面の内側にめり込む。
    //   半径 R、頂点間角度 θ の chord 中点までの距離は R*cos(θ/2)。
    //   18×12 (θ=20°) で wire 半径 1.008 だと 1.008 * cos(10°) = 0.993 < fill 1.0 で
    //   edge の中ほどが fill に occlude されて途切れて見える。
    //   24×16 (θ=15°) + 半径 1.015 にすれば 1.015 * cos(7.5°) = 1.006 > 1.0 で全 chord
    //   中点が fill の外に出て、線が途切れず描画される。
    const fillGeometry = useMemo(
        () => new THREE.SphereGeometry(1.0, 36, 24),
        [],
    );
    const wireBaseGeometry = useMemo(
        () => new THREE.SphereGeometry(1.009, 24, 16),
        [],
    );
    const wireGeometry = useMemo(
        () => new THREE.EdgesGeometry(wireBaseGeometry, 1),
        [wireBaseGeometry],
    );
    useEffect(() => {
        return () => {
            fillGeometry.dispose();
            wireBaseGeometry.dispose();
            wireGeometry.dispose();
        };
    }, [fillGeometry, wireBaseGeometry, wireGeometry]);

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

    useFrame((_, dt) => {
        if (!groupRef.current) return;
        if (!reduced) {
            // 連続 rotation のみ。entrance は wrapper 側の opacity (GSAP 駆動) に任せる
            groupRef.current.rotation.y += dt * 0.06; // ~17 sec / rotation
        }
    });

    return (
        <group ref={groupRef} rotation={[0.32, 0, 0]}>
            {/* 不可視 fill: 色は描画しない (colorWrite=false) が depth buffer には書き込む。
                これにより:
                  - 視覚的には transparent (= 球体ボディは見えない)
                  - 裏側の wireframe / arc は depth test で discard されて見えない
                「透過 + 裏面非表示」を両立する standard な depth-only mask。 */}
            <mesh geometry={fillGeometry}>
                <meshBasicMaterial colorWrite={false} />
            </mesh>

            {/* wireframe — lineSegments + EdgesGeometry で line だけを明示的に描画。
                半径 1.008 で fill (1.0) より僅かに外、z-fighting なし。 */}
            <lineSegments geometry={wireGeometry}>
                <lineBasicMaterial color="#999999" />
            </lineSegments>

            {/* arcs (Cloudflare orange、reduced-motion ではアニメ自体を出さない) */}
            {!reduced &&
                arcRefs.map((ref, i) => (
                    <ArcLine key={i} stateRef={ref} color={CLOUDFLARE_ORANGE} />
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

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={className} aria-hidden />;
    }

    return (
        <div className={className} aria-hidden>
            <Canvas
                camera={{ position: [0, 0, 4.2], fov: 40 }}
                dpr={[1, 1.5]}
                frameloop="always"
                flat
                gl={{ antialias: true, alpha: true }}
            >
                <Globe reduced={reduced} />
            </Canvas>
        </div>
    );
};
