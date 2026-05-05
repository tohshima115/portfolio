import React, { useEffect, useRef, useState } from 'react';
import {
    animate,
    AnimatePresence,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from 'framer-motion';
import { ContourBackground } from '../PrtsInterface/components/ContourBackground';
import { HoverBackground } from '../PrtsInterface/components/HoverBackground';
import { FloorPlane } from '../PrtsInterface/components/FloorPlane';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import { HeroLayer } from './layers/HeroLayer';
import { AIChatClipLayer } from './layers/AIChatClipLayer';
import { PLDashboardLayer } from './layers/PLDashboardLayer';
import { SweptLayer } from './layers/SweptLayer';
import { AboutLayer } from './layers/AboutLayer';
import { ContactCTALayer } from './layers/ContactCTALayer';
import type { UpdateItem } from './types';

export type { UpdateItem };

// Hero / AIChatClip / PL Dashboard / Swept / About / CTA の 6 セクション。
// ネイティブスクロールは止め、wheel/touch で蓄積した量が閾値を越えると
// camera をアニメーション付きで次セクションへ進める "snap" 方式。
const SECTION_COUNT = 6;
// セクション間移動を発火する累積スクロール量 (px 相当)
const SNAP_THRESHOLD = 600;
// 入力が止まったら蓄積をリセットするまでの時間 (ms)
const ACCUM_DECAY_MS = 700;
// セクション間カメラ移動のアニメーション (強めの加減速)
const SNAP_DURATION_S = 1.05;
const SNAP_EASE = [0.83, 0, 0.17, 1] as const; // ease-in-out-quint

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

export const HomeScene = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [skipIntro] = useState<boolean>(readSkipIntroFlag);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mb = window.matchMedia('(max-width: 640px)');
        const u1 = () => setReducedMotion(rm.matches);
        const u2 = () => setIsMobile(mb.matches);
        u1();
        u2();
        rm.addEventListener('change', u1);
        mb.addEventListener('change', u2);
        return () => {
            rm.removeEventListener('change', u1);
            mb.removeEventListener('change', u2);
        };
    }, []);

    // ----- Mouse parallax (PRTS の鳥瞰角) -----
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [16, 24]), springConfig);
    const contentX = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
    const contentY = useSpring(useTransform(mouseY, [0, 1], [-5, 5]), springConfig);

    // mousemove の rect 計算は viewport (sticky 中身) を基準にする
    const rectRef = useRef<DOMRect | null>(null);
    useEffect(() => {
        const target = viewportRef.current;
        if (!target) return;
        const update = () => {
            rectRef.current = target.getBoundingClientRect();
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(target);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = rectRef.current;
        if (!rect) return;
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    };
    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    // 同一オリジンリンクは WebGL トランジションへ
    const handleLinkClick = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest('a');
        if (
            target &&
            target.href &&
            !target.href.startsWith('javascript') &&
            !target.href.includes('#')
        ) {
            try {
                const url = new URL(target.href);
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    playWebGLTransition({
                        url: target.pathname + target.search + target.hash,
                    });
                }
            } catch {
                /* ignore */
            }
        }
    };

    // ----- Section index → cameraProgress (0..1) -----
    // ネイティブスクロールを止め、wheel/touch を蓄積。閾値で次セクションへ animate。
    const cameraProgress = useMotionValue(0);
    const sectionIndexRef = useRef(0);
    const accumRef = useRef(0);
    const isAnimatingRef = useRef(false);
    const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [sectionIndex, setSectionIndex] = useState(0);
    const [gauge, setGauge] = useState(0); // -1..1 (-1=上方向満タン, +1=下方向満タン)

    const transitionTo = (next: number) => {
        const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, next));
        if (clamped === sectionIndexRef.current) {
            // 端で空打ちした場合: 累積をクリアしてゲージも消す
            accumRef.current = 0;
            setGauge(0);
            return;
        }
        sectionIndexRef.current = clamped;
        setSectionIndex(clamped);
        accumRef.current = 0;
        setGauge(0);
        isAnimatingRef.current = true;
        if (decayTimerRef.current) {
            clearTimeout(decayTimerRef.current);
            decayTimerRef.current = null;
        }
        const target = clamped / (SECTION_COUNT - 1);
        animate(cameraProgress, target, {
            duration: reducedMotion ? 0 : SNAP_DURATION_S,
            ease: [SNAP_EASE[0], SNAP_EASE[1], SNAP_EASE[2], SNAP_EASE[3]],
            onComplete: () => {
                isAnimatingRef.current = false;
            },
        });
    };

    const handleDelta = (deltaY: number) => {
        if (isAnimatingRef.current) return;
        accumRef.current += deltaY;
        const idx = sectionIndexRef.current;
        // 端での過剰蓄積はクランプ
        if (idx === 0 && accumRef.current < 0) accumRef.current = 0;
        if (idx === SECTION_COUNT - 1 && accumRef.current > 0) accumRef.current = 0;

        // しきい値到達 → 次へ
        if (accumRef.current >= SNAP_THRESHOLD) {
            transitionTo(idx + 1);
            return;
        }
        if (accumRef.current <= -SNAP_THRESHOLD) {
            transitionTo(idx - 1);
            return;
        }

        // ゲージ更新 (-1..1)
        setGauge(Math.max(-1, Math.min(1, accumRef.current / SNAP_THRESHOLD)));

        // 入力が途切れたら蓄積を 0 に戻す
        if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
        decayTimerRef.current = setTimeout(() => {
            accumRef.current = 0;
            setGauge(0);
        }, ACCUM_DECAY_MS);
    };

    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            // ネイティブスクロールを完全に止めて自前蓄積へ
            e.preventDefault();
            handleDelta(e.deltaY);
        };
        let lastTouchY: number | null = null;
        const onTouchStart = (e: TouchEvent) => {
            lastTouchY = e.touches[0].clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (lastTouchY === null) return;
            const y = e.touches[0].clientY;
            const dy = (lastTouchY - y) * 2; // 指 1px ≒ ホイール 2px 換算
            lastTouchY = y;
            e.preventDefault();
            handleDelta(dy);
        };
        const onKey = (e: KeyboardEvent) => {
            // ヘッダーや CTA 内部の入力欄からのキーは透過させたい
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                transitionTo(sectionIndexRef.current + 1);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                transitionTo(sectionIndexRef.current - 1);
            } else if (e.key === 'Home') {
                e.preventDefault();
                transitionTo(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                transitionTo(SECTION_COUNT - 1);
            }
        };
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('keydown', onKey);
            if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
        };
    }, [reducedMotion]);

    // ContourBackground (R3F canvas) は親 DOM に CSS transform を当てると
    // framebuffer サイズが post-projection AABB で計測されて崩れる既知の制約があり、
    // カメラ div の子に置けない。そのため camera の motion value を ContourBackground に
    // 直接渡し、canvas DOM 自身の transform に組み込んで他のレイヤーと同じ位置に
    // anchor させる (= 構造上スクロールで他のレイヤーと一緒に流れる)。
    // カメラ Y は vh 文字列だと canvas の transform に渡せないので px に揃える。
    const vhRef = useRef<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
    useEffect(() => {
        const u = () => {
            vhRef.current = window.innerHeight;
        };
        u();
        window.addEventListener('resize', u);
        return () => window.removeEventListener('resize', u);
    }, []);

    // 補正: モバイル / reduced motion のときは横方向の振幅を抑える
    const ampXY = isMobile || reducedMotion ? 0 : 1;

    // piecewise linear interpolation helper (6 stops, equal spacing)
    const interp = (p: number, stops: number[]): number => {
        const breaks = [0, 0.2, 0.4, 0.6, 0.8, 1];
        if (p <= breaks[0]) return stops[0];
        for (let i = 0; i < breaks.length - 1; i++) {
            if (p <= breaks[i + 1]) {
                const t = (p - breaks[i]) / (breaks[i + 1] - breaks[i]);
                return stops[i] + (stops[i + 1] - stops[i]) * t;
            }
        }
        return stops[stops.length - 1];
    };

    // 各セクションを (0, 0) を中心にした円の "中" にバラ撒く。
    // Y を単調増加にせず、負値 (= Hero より上) も取らせる。scroll は
    // snap 方式で「次に進む」トリガにすぎないので、camera が上に飛んでも
    // 動作上は問題ない (世界全体が画面上を流れるだけ)。
    //
    // 配置の意図 (X は px、Y は vh で表記、原点は Hero):
    //   index 0  Hero        ( 0,     0vh )  原点
    //   index 1  AIChatClip  (-560, -38vh)  左上、遠目
    //   index 2  PLDashboard ( 540, -36vh)  右上 (Hero 上を大きく対角横断)
    //   index 3  Swept       (-480,  40vh)  左下、遠目
    //   index 4  About       ( 560,  38vh)  右下、遠目
    //   index 5  CTA         (-120, -52vh)  上、中央寄り (Y は最も上)
    //
    // (0, 0) からの距離はおよそ 45〜65vh 相当 (px と vh を 1vh ≒ 8px 換算で
    // ざっくり同列に評価) の範囲で、画面サイズの "ある半径の円の中" に納まる。
    //
    // モバイル / reduced motion (ampXY = 0) のときは中心散布の意味が
    // なくなる + 横ジャンプが視覚的にうるさいので、X を潰し Y を 80vh
    // 等間隔の単調増加に切り替えて素直な縦スクロールに退化させる。
    const SECTION_X =
        ampXY > 0 ? [0, -560, 540, -480, 560, -120] : [0, 0, 0, 0, 0, 0];
    const SECTION_Y_VH =
        ampXY > 0 ? [0, -38, -36, 40, 38, -52] : [0, 80, 160, 240, 320, 400];
    // 各セクションの "天地" (画面平面内 = Z 軸まわりの回転)。Hero は 0 で
    // 据え置き、他のセクションは ±15〜20° と強めに傾けて付箋がランダムに
    // 貼ってある雰囲気にする。camera 側で逆方向に回すので停止時は必ず
    // 正面に揃う = 読みやすさ維持。
    // モバイル / reduced motion (ampXY=0) のときは全 0 にして傾きを消す。
    const SECTION_RZ =
        ampXY > 0 ? [0, -18, 16, -14, 17, -10] : [0, 0, 0, 0, 0, 0];

    const cameraX = useTransform(cameraProgress, (p) =>
        -interp(p, SECTION_X),
    );
    const cameraY = useTransform(cameraProgress, (p) => {
        const vh = vhRef.current;
        return -interp(
            p,
            SECTION_Y_VH.map((vhFrac) => (vhFrac * vh) / 100),
        );
    });
    // camera RZ は section の rotateZ を逆回転で打ち消すので "停止時は section
    // の天地が画面の天地に揃う" = 常に正面読み。間にある 1.05s の transition では
    // 「次の天地に向かって」必要最小限の Z 軸回転が自然に発生する。
    const cameraRZ = useTransform(cameraProgress, (p) =>
        -interp(p, SECTION_RZ),
    );
    // Z / Y 軸回転は使わない (XY 平面上の散らし + Z 軸回転だけで充分)。
    // ContourBackground 側の transform 互換のため motion value としては残す。
    const cameraZ = useTransform(cameraProgress, () => 0);
    const cameraRY = useTransform(cameraProgress, () => 0);

    return (
        <section
            ref={scrollRef}
            className="relative w-full h-screen overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClickCapture={handleLinkClick}
        >
            <div
                ref={viewportRef}
                className="absolute inset-0 w-full h-full bg-background overflow-hidden flex items-center justify-center shadow-inner"
                style={{ perspective: '1000px' }}
            >
                <ContourBackground
                    skipIntro={skipIntro}
                    rotateX={rotateX}
                    cameraX={cameraX}
                    cameraY={cameraY}
                    cameraZ={cameraZ}
                    cameraRY={cameraRY}
                    cameraRZ={cameraRZ}
                />
                <HoverBackground hoveredItem={hoveredItem} />

                {/*
                  外側ラッパ:
                  - rotateX = mouse Y 連動の鳥瞰角 (parallax)
                  - rotateZ = cameraRZ (= 各 section の rotateZ を打ち消す逆回転)
                  framer-motion は style の rotateX → rotateZ をこの順で
                  transform string `rotateX(...) rotateZ(...)` に展開する。
                  行列上 R_x * R_z * (内側 translate) となり、point に対しては
                  T → R_z → R_x の順で適用される。section transform が T*R_z
                  なので、camera の R_z(-θ) * T(-x,-y) で完全に打ち消し可能 =
                  停止時は section の天地が画面の天地に揃う。
                */}
                <motion.div
                    style={{
                        rotateX,
                        rotateZ: cameraRZ,
                        transformStyle: 'preserve-3d',
                    }}
                    className="relative w-[150vw] h-[150vh] flex items-center justify-center origin-center"
                >
                    {/* "カメラ" = scroll 進捗に応じてシーン全体を逆方向へ動かす */}
                    <motion.div
                        style={{
                            x: cameraX,
                            y: cameraY,
                            z: cameraZ,
                            rotateY: cameraRY,
                            transformStyle: 'preserve-3d',
                        }}
                        className="absolute inset-0 origin-center"
                    >
                        {/* Hero (centered) */}
                        {/*
                          NavigationLayer (translateZ 160) / MainTitle (80) など
                          HeroLayer 内の 3D 子要素を camera の 3D 空間に正しく
                          載せるため preserve-3d を維持する。flat にすると
                          HeroLayer 全体が 1 枚の 2D タイルに焼かれ、camera の
                          rotateX (マウス連動 spring) で毎フレーム射影が微小に
                          変わるたびに RSS / 各 NAV ボタンのテキスト/枠が
                          subpixel rounding でチラついて見える。
                        */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                transform: 'translate3d(0, 0, 0)',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            <HeroLayer
                                skipIntro={skipIntro}
                                contentX={contentX}
                                contentY={contentY}
                                onHoverItem={setHoveredItem}
                                mouseX={mouseX}
                                mouseY={mouseY}
                                updates={updates}
                            />
                        </div>

                        {/* AIChatClip: 左上 (CCW に少し傾ける) */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                transform: `translate3d(${SECTION_X[1]}px, ${SECTION_Y_VH[1]}vh, 0) rotateZ(${SECTION_RZ[1]}deg)`,
                            }}
                        >
                            <FloorPlane />
                            <AIChatClipLayer progress={cameraProgress} />
                        </div>

                        {/* PL Dashboard: 右上 (CW に傾ける) */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                transform: `translate3d(${SECTION_X[2]}px, ${SECTION_Y_VH[2]}vh, 0) rotateZ(${SECTION_RZ[2]}deg)`,
                            }}
                        >
                            <FloorPlane />
                            <PLDashboardLayer progress={cameraProgress} />
                        </div>

                        {/* Swept: 左下 (CCW) */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                transform: `translate3d(${SECTION_X[3]}px, ${SECTION_Y_VH[3]}vh, 0) rotateZ(${SECTION_RZ[3]}deg)`,
                            }}
                        >
                            <FloorPlane />
                            <SweptLayer progress={cameraProgress} />
                        </div>

                        {/* About: 右下 (CW) */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                transform: `translate3d(${SECTION_X[4]}px, ${SECTION_Y_VH[4]}vh, 0) rotateZ(${SECTION_RZ[4]}deg)`,
                            }}
                        >
                            <FloorPlane />
                            <AboutLayer progress={cameraProgress} />
                        </div>

                        {/* CTA: 中央寄り、原点近くへ帰る (CCW) */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                transform: `translate3d(${SECTION_X[5]}px, ${SECTION_Y_VH[5]}vh, 0) rotateZ(${SECTION_RZ[5]}deg)`,
                            }}
                        >
                            <FloorPlane />
                            <ContactCTALayer progress={cameraProgress} />
                        </div>
                    </motion.div>
                </motion.div>

                {/* セクション間スナップ用ゲージ + 現在位置ドット */}
                <SnapHud
                    gauge={gauge}
                    sectionIndex={sectionIndex}
                    sectionCount={SECTION_COUNT}
                    onJump={transitionTo}
                />
            </div>
        </section>
    );
};

interface SnapHudProps {
    gauge: number; // -1..1
    sectionIndex: number;
    sectionCount: number;
    onJump: (i: number) => void;
}

const CIRCLE_R = 18;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R;

const SnapHud = ({ gauge, sectionIndex, sectionCount, onJump }: SnapHudProps) => {
    const abs = Math.min(1, Math.abs(gauge));
    const dashOffset = CIRCLE_C - abs * CIRCLE_C;
    const active = abs > 0.02;

    return (
        <>
            {/* 蓄積ゲージ (画面下中央) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-2">
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 50 50">
                        <circle
                            cx="25"
                            cy="25"
                            r={CIRCLE_R}
                            fill="none"
                            stroke="var(--color-foreground)"
                            strokeOpacity="0.15"
                            strokeWidth="1.5"
                        />
                        <circle
                            cx="25"
                            cy="25"
                            r={CIRCLE_R}
                            fill="none"
                            stroke="var(--color-accent)"
                            strokeWidth="1.5"
                            strokeDasharray={CIRCLE_C}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 120ms linear' }}
                        />
                    </svg>
                    <motion.span
                        animate={active ? { y: 0 } : { y: [0, 5, 0] }}
                        transition={
                            active
                                ? { duration: 0 }
                                : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                        }
                        className={`block w-px h-3 ${active ? 'bg-accent' : 'bg-foreground/50'}`}
                    />
                </div>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={active ? 'snap' : 'idle'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
                    >
                        {active
                            ? gauge > 0
                                ? 'Hold ▼'
                                : 'Hold ▲'
                            : sectionIndex === sectionCount - 1
                              ? '— End —'
                              : 'Scroll'}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* セクションインジケータ (右端中央) */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 pointer-events-auto">
                {Array.from({ length: sectionCount }).map((_, i) => {
                    const isActive = i === sectionIndex;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onJump(i)}
                            aria-label={`Section ${i + 1}`}
                            className="group flex items-center gap-2"
                        >
                            <span
                                className={`block h-px transition-all duration-300 ${
                                    isActive
                                        ? 'w-6 bg-accent'
                                        : 'w-3 bg-foreground/30 group-hover:bg-foreground/60'
                                }`}
                            />
                        </button>
                    );
                })}
            </div>
        </>
    );
};
