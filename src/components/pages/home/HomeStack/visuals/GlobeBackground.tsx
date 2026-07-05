import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
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
// arc は TubeGeometry (curve に沿った 3D チューブ) で描画。
//   tubularSegments = 64 で curve に沿った分割数
//   radialSegments = 6 で断面の正六角形
//   radius = 0.008 (world units) でカメラ z=4.2 fov=40° のフレームでだいたい 3px 太さ
// indexed BufferGeometry なので setDrawRange(0, indices) でクリーンに部分描画できる。
// 1 tubular につき radialSegments * 2 triangle = 12 triangle = 36 indices
const ARC_TUBULAR_SEGMENTS = 64;
const ARC_RADIAL_SEGMENTS = 6;
const ARC_TUBE_RADIUS = 0.008;
const INDICES_PER_TUBULAR = ARC_RADIAL_SEGMENTS * 6;

// 起点と終点が短すぎる arc は「ちょっと光ってすぐ消える点」になって絵にならないので、
// 弦長 (= 球面 chord 長) が一定以上のペアだけ採用する。
// 1.0 = 球面上 60° の角距離 (e.g., 東京〜デリー級) 以上。
// 1.95 上限は anti-podal (180°) 近傍で slerp が degenerate するのを避けるため。
const MIN_ARC_CHORD = 1.0;
const MAX_ARC_CHORD = 1.95;

// arc curve の頂点 lift (大円上に乗せた状態から外側にどれだけ盛り上げるか)。
// 1.18 = 球面 +18% で camera フレーム内に余裕で収まり、長距離 arc も球を突き抜けない。
const ARC_PEAK_LIFT = 1.18;

// 大円 (great circle) に沿って slerp し、t=0..1 を放物線で外側に持ち上げる Curve。
// QuadraticBezierCurve3(from, mid, to) は弦に対する bezier なので長距離だと
// 曲線が球の内側に潜って fill に occlude されてしまう (90°arc midpoint = 0.94 で球内)。
// 大円ベースなら curve は常に半径 >= 1.0 を保つので球面を突き抜けない。
class GreatCircleArcCurve extends THREE.Curve<THREE.Vector3> {
    private fromUnit: THREE.Vector3;
    private toUnit: THREE.Vector3;
    private omega: number;
    private sinOmega: number;
    private peakLift: number;

    constructor(from: THREE.Vector3, to: THREE.Vector3, peakLift: number) {
        super();
        this.fromUnit = from.clone().normalize();
        this.toUnit = to.clone().normalize();
        const dot = THREE.MathUtils.clamp(
            this.fromUnit.dot(this.toUnit),
            -1,
            1,
        );
        this.omega = Math.acos(dot);
        this.sinOmega = Math.sin(this.omega);
        this.peakLift = peakLift;
    }

    getPoint(
        t: number,
        optionalTarget: THREE.Vector3 = new THREE.Vector3(),
    ): THREE.Vector3 {
        let onSphere: THREE.Vector3;
        if (this.sinOmega < 0.001) {
            // 起点と終点がほぼ一致 or 完全に antipodal の縮退ケース。
            // randomArc 側で除外しているはずだが念のため lerp + 正規化で fallback。
            onSphere = this.fromUnit.clone().lerp(this.toUnit, t);
            if (onSphere.lengthSq() > 1e-6) onSphere.normalize();
            else onSphere.copy(this.fromUnit);
        } else {
            const sa = Math.sin((1 - t) * this.omega) / this.sinOmega;
            const sb = Math.sin(t * this.omega) / this.sinOmega;
            onSphere = this.fromUnit
                .clone()
                .multiplyScalar(sa)
                .add(this.toUnit.clone().multiplyScalar(sb));
        }
        // 放物線リフト: 4*t*(1-t) は t=0,1 で 0、t=0.5 で 1
        const lift = 1.0 + 4 * t * (1 - t) * (this.peakLift - 1.0);
        return optionalTarget.copy(onSphere).multiplyScalar(lift);
    }
}

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
            POP_VECTORS[fromIdx].distanceTo(POP_VECTORS[toIdx]) <
                MIN_ARC_CHORD ||
            POP_VECTORS[fromIdx].distanceTo(POP_VECTORS[toIdx]) >
                MAX_ARC_CHORD) &&
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

// arc は TubeGeometry (curve に沿った 3D チューブ) を Mesh で描画。
// indexed BufferGeometry なので setDrawRange(0, indices) で素直に成長アニメ可能。
// Line2 instanceCount で growing が効かなかった (= 先端だけ表示後に止まる) のを回避。
const ArcLine: React.FC<ArcLineProps> = ({ stateRef, color }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lastIdsRef = useRef<{ fromIdx: number; toIdx: number } | null>(null);

    const material = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0,
                depthTest: true,
                depthWrite: false,
            }),
        [color],
    );

    const initialGeometry = useMemo(() => {
        // dummy curve、最初の useFrame で実際の curve に置き換わる
        const dummy = new THREE.LineCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.001, 0, 0),
        );
        const g = new THREE.TubeGeometry(
            dummy,
            1,
            ARC_TUBE_RADIUS,
            ARC_RADIAL_SEGMENTS,
            false,
        );
        g.setDrawRange(0, 0);
        return g;
    }, []);

    useEffect(() => {
        return () => {
            material.dispose();
            const m = meshRef.current;
            if (m) m.geometry.dispose();
            else initialGeometry.dispose();
        };
    }, [material, initialGeometry]);

    useFrame((_, dt) => {
        const state = stateRef.current;
        const mesh = meshRef.current;
        if (!mesh) return;

        // endpoints が変わったら TubeGeometry を作り直し
        if (
            !lastIdsRef.current ||
            lastIdsRef.current.fromIdx !== state.fromIdx ||
            lastIdsRef.current.toIdx !== state.toIdx
        ) {
            const from = POP_VECTORS[state.fromIdx];
            const to = POP_VECTORS[state.toIdx];
            // 大円沿い + 放物線リフト。fixed peakLift で長距離 arc も球を突き抜けない。
            const curve = new GreatCircleArcCurve(from, to, ARC_PEAK_LIFT);
            const newGeo = new THREE.TubeGeometry(
                curve,
                ARC_TUBULAR_SEGMENTS,
                ARC_TUBE_RADIUS,
                ARC_RADIAL_SEGMENTS,
                false,
            );
            mesh.geometry.dispose();
            mesh.geometry = newGeo;
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

        // 0..0.5 で先端から伸びる (drawRange を indices ぶん広げる)、0.5..1.0 で fade out
        const phase = state.phase;
        let segments: number;
        let opacity: number;
        if (phase <= 0.5) {
            segments = Math.max(
                1,
                Math.floor((phase / 0.5) * ARC_TUBULAR_SEGMENTS),
            );
            opacity = Math.min(0.9, phase * 6);
        } else {
            segments = ARC_TUBULAR_SEGMENTS;
            opacity = 0.9 * (1 - (phase - 0.5) / 0.5);
        }
        mesh.geometry.setDrawRange(0, segments * INDICES_PER_TUBULAR);
        material.opacity = opacity;
    });

    return <mesh ref={meshRef} geometry={initialGeometry} material={material} />;
};

interface GlobeProps {
    reduced: boolean;
    scrollVelRef: React.MutableRefObject<number>;
}

const Globe: React.FC<GlobeProps> = ({ reduced, scrollVelRef }) => {
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
            // スクロール速度を減衰させながら base rotation に加算する。
            // wheel/touch で加えられた impulse がここで自然に収束する。
            scrollVelRef.current *= Math.pow(0.85, dt * 60);
            groupRef.current.rotation.y += dt * (0.06 + scrollVelRef.current);
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
    const scrollVelRef = useRef(0);

    useEffect(() => {
        setMounted(true);
        if (reduced) return;

        let touchPrevY = 0;

        const onWheel = (e: WheelEvent) => {
            const impulse = e.deltaY * 0.00015;
            scrollVelRef.current = Math.max(-0.08, Math.min(0.40, scrollVelRef.current + impulse));
        };
        const onTouchStart = (e: TouchEvent) => {
            touchPrevY = e.touches[0].clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
            const dy = touchPrevY - e.touches[0].clientY;
            touchPrevY = e.touches[0].clientY;
            const impulse = dy * 0.0003;
            scrollVelRef.current = Math.max(-0.08, Math.min(0.40, scrollVelRef.current + impulse));
        };

        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [reduced]);

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
                <Globe reduced={reduced} scrollVelRef={scrollVelRef} />
            </Canvas>
        </div>
    );
};
