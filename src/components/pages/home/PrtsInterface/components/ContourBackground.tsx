import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { animate, type MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { contourVertex, contourFragment } from '../shaders/contour';
import { dollyScale, dollyBlurPxBg, dollyOpacity } from '../../HomeIntro/dollyCurves';

interface Props {
    /** イントロアニメをスキップするか (sessionStorage 由来) */
    skipIntro?: boolean;
    /**
     * カメラ追従用の X 軸回転 (deg)。任意。
     *
     * 重要: 親 DOM に CSS transform + perspective をかけると R3F の Canvas が
     * `getBoundingClientRect` で post-projection の AABB を読み、framebuffer を
     * 不当に拡大して画面中央からズレる (2024 年の調査で確認済み)。
     * そのため transform は ContourBackground 自身が canvas DOM 要素へ直接当てる。
     * 親側で transform を巻くのは禁止。
     */
    rotateX?: MotionValue<number>;
    /**
     * マウス連動の Z 軸回転 (deg)。HeroSection の外側 motion.div に当てている
     * rotateZ と同じ値を渡すと、等高線も画面平面で同じ向きに傾く。
     */
    rotateZ?: MotionValue<number>;
    /**
     * シーン内の camera 位置 (= シーン全体に当てる逆方向 translate / rotateY)。
     * 上記の制約で ContourBackground を camera div の子に置けないため、
     * 同じ値を canvas DOM に直接当てて Hero アンカー位置を再現する。
     */
    cameraX?: MotionValue<number>;
    cameraY?: MotionValue<number>;
    cameraZ?: MotionValue<number>;
    cameraRY?: MotionValue<number>;
    /**
     * camera Z 軸回転 (deg)。各セクションが画面平面内で異なる "天地" を
     * 持つ場合、camera が逆回転で打ち消す。Hero アンカーの contour も
     * 同じだけ回転させてシーンと位相を揃える。
     */
    cameraRZ?: MotionValue<number>;
    /**
     * 0..1 の「乱れ」係数。Hero→Statement 遷移演出 (案 A) で進捗連動して
     * shader の uChaos uniform を動かす。
     * MotionValue を渡せば購読 + invalidate で frameloop="demand" に乗る。
     * 数値で渡せば mount 時に固定値として set。
     * 渡さないと 0 (= 現状の Hero 単体表示) で完全に既存挙動を維持。
     */
    chaos?: MotionValue<number> | number;
    /**
     * 0..1 の Hero→Statement dolly 進捗。canvas DOM の scale + filter:blur に反映。
     * 渡さないと scale=1 / blur=0 で完全に既存挙動を維持。
     */
    dolly?: MotionValue<number>;
}

const TARGET_OPACITY = 0.26;
// uSpeed が極めて遅いのでフレーム間差分は視覚的に区別できない。24fps まで落としても劣化なし。
const TARGET_FPS = 24;
// 親 DOM の perspective は R3F のラッパ越しに canvas へ伝わらないため、canvas 自身の
// transform に perspective() を組み込んでパース感を出す。値は親の perspective: 1000px と同等。
const CANVAS_PERSPECTIVE_PX = 1000;
// イントロアニメ (3D シーンの内側 intro container と同じ値・タイミング)
// PrtsInterface の inner intro container `initial={{ scale: 1.8, rotateY: -30, rotateX: 20 }}`
// が delay 3.4s / duration 1.2s / ease-in-out-quint で identity へ animate するのを
// ContourBackground でも再現する。これがないと等高線だけ「ズームアウト前の傾き」を
// 反映できず、ロゴアニメ中に取り残されて見える。
const INTRO_INITIAL = { scale: 1.8, rotateY: -30, rotateX: 20 } as const;
const INTRO_DELAY_S = 3.4;
const INTRO_DURATION_S = 1.2;
const INTRO_EASE = [0.83, 0, 0.17, 1] as const;

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

export const ContourBackground: React.FC<Props> = ({
    skipIntro = false,
    rotateX,
    rotateZ,
    cameraX,
    cameraY,
    cameraZ,
    cameraRY,
    cameraRZ,
    chaos,
    dolly,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const introProgressRef = useRef<number>(skipIntro ? 1 : 0); // 0 = 初期状態, 1 = 終端
    const [reducedMotion, setReducedMotion] = useState(false);
    const [contextLost, setContextLost] = useState(false);
    const [inView, setInView] = useState(true);

    // 親 DOM に transform をかけると R3F が canvas を over-size するので、
    // rotateX (とイントロ用 transform) はすべて canvas DOM 要素に直接当てる。
    // - canvas の CSS width/height は変わらない (ResizeObserver は layout 変化のみ検知)
    //   ので R3F の auto-resize には影響しない。
    // - perspective() を transform に組み込むことで、親の perspective プロパティに
    //   依存せず単独でパース感を出す。
    const applyTransform = useCallback(() => {
        const c = canvasRef.current;
        if (!c) return;
        const mouseX = rotateX?.get() ?? 0;
        const mouseZ = rotateZ?.get() ?? 0;
        const cx = cameraX?.get() ?? 0;
        const cy = cameraY?.get() ?? 0;
        const cz = cameraZ?.get() ?? 0;
        const cry = cameraRY?.get() ?? 0;
        const crz = cameraRZ?.get() ?? 0;
        const p = introProgressRef.current;
        // p=0 で initial, p=1 で identity。線形補間。
        const introX = INTRO_INITIAL.rotateX * (1 - p);
        const introY = INTRO_INITIAL.rotateY * (1 - p);
        const introS = INTRO_INITIAL.scale + (1 - INTRO_INITIAL.scale) * p;
        // Hero→Statement dolly (案 G)。canvas DOM の scale に乗算で重ねる。
        const d = dolly?.get() ?? 0;
        const dScale = dollyScale(d);
        const dBlur = dollyBlurPxBg(d);
        const dOpa = dollyOpacity(d);
        // ロゴ側 (HeroSection outer motion.div + 内側 HeroLayer) の実効合成順と
        // 完全一致させる:
        //   outer:  rotateX(mouseX) rotateZ(mouseZ) scale(dolly)
        //   inner:  scale(intro)  rotateY(introY)  rotateX(introX)
        //   ⇒ 行列積 = rotateX(mouseX)·rotateZ(mouseZ)·scale(dolly)·
        //              scale(intro)·rotateY(introY)·rotateX(introX)
        // CSS transform は左から並べた順に行列を左から掛けるので、上記をそのまま
        // 並べれば point への作用順 (右→左) も一致する。
        //
        // mouseX/Z は intro と"別の位置"にあるので合算してはいけない (途中に
        // rotateY(introY) が挟まると合成順が崩れて、ロゴが浅い角度に見える)。
        //
        // camera 系 (HomeScene 用) は本来 outer wrapper として最外側に巻く想定。
        // ここでは行列順を維持するため、camera を最外側、その内側に Hero local
        // の合成を並べる。Hero 単独 (HomeIntro 経由) は camera = 0 で無影響。
        c.style.transform =
            `perspective(${CANVAS_PERSPECTIVE_PX}px) ` +
            `rotateZ(${crz}deg) ` +
            `translate3d(${cx}px, ${cy}px, ${cz}px) ` +
            `rotateY(${cry}deg) ` +
            `rotateX(${mouseX}deg) ` +
            `rotateZ(${mouseZ}deg) ` +
            `scale(${dScale}) ` +
            `scale(${introS}) ` +
            `rotateY(${introY}deg) ` +
            `rotateX(${introX}deg)`;
        // blur(0px) でも GPU レイヤを 1 枚作るブラウザがあるので閾値前は filter を空に。
        c.style.filter = dBlur > 0.05 ? `blur(${dBlur.toFixed(2)}px)` : '';
        c.style.opacity = dOpa < 0.999 ? dOpa.toFixed(3) : '';
        c.style.willChange = d > 0.01 ? 'transform, filter, opacity' : '';
    }, [rotateX, rotateZ, cameraX, cameraY, cameraZ, cameraRY, cameraRZ, dolly]);

    // マウス連動 rotateX/rotateZ + camera motion values + dolly の購読
    useEffect(() => {
        applyTransform();
        const unsubs: Array<() => void> = [];
        if (rotateX) unsubs.push(rotateX.on('change', applyTransform));
        if (rotateZ) unsubs.push(rotateZ.on('change', applyTransform));
        if (cameraX) unsubs.push(cameraX.on('change', applyTransform));
        if (cameraY) unsubs.push(cameraY.on('change', applyTransform));
        if (cameraZ) unsubs.push(cameraZ.on('change', applyTransform));
        if (cameraRY) unsubs.push(cameraRY.on('change', applyTransform));
        if (cameraRZ) unsubs.push(cameraRZ.on('change', applyTransform));
        if (dolly) unsubs.push(dolly.on('change', applyTransform));
        return () => {
            for (const u of unsubs) u();
        };
    }, [rotateX, rotateZ, cameraX, cameraY, cameraZ, cameraRY, cameraRZ, dolly, applyTransform]);

    // イントロアニメ (3D シーンの inner intro container と同じタイミングで進行)
    useEffect(() => {
        if (skipIntro || reducedMotion) {
            introProgressRef.current = 1;
            applyTransform();
            return;
        }
        introProgressRef.current = 0;
        applyTransform();
        const a = animate(0, 1, {
            delay: INTRO_DELAY_S,
            duration: INTRO_DURATION_S,
            ease: [INTRO_EASE[0], INTRO_EASE[1], INTRO_EASE[2], INTRO_EASE[3]],
            onUpdate: (v) => {
                introProgressRef.current = v;
                applyTransform();
            },
        });
        return () => a.stop();
    }, [skipIntro, reducedMotion, applyTransform]);

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
                    canvasRef.current = canvas;
                    // 初期 transform を即座に反映 (mount 直後の 1 フレーム空白を防ぐ)
                    applyTransform();
                    const handleLost = (e: Event) => {
                        e.preventDefault();
                        setContextLost(true);
                    };
                    canvas.addEventListener('webglcontextlost', handleLost, { once: true });
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
