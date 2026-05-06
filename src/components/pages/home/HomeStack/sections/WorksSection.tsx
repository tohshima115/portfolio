import { useRef } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { WorksFlagshipPart } from './WorksFlagshipPart';
import { WorksOpsCarousel } from './WorksOpsCarousel';
import { DividerMarker } from '../visuals/DividerMarker';
import { GlobeBackground } from '../visuals/GlobeBackground';

// 本番投入している Cloudflare サービス。Workers/D1 の compute & DB 軸 +
// R2 のオブジェクトストレージ + DO の状態管理 + Workers AI + Zero Trust の認証。
const CLOUDFLARE_SERVICES = [
    'Workers',
    'D1',
    'R2',
    'Durable Objects',
    'Workers AI',
    'Zero Trust',
];

// WorksLead = Hero と Flagship の温度差クッション。
//
// 動作:
//   - GSAP ScrollTrigger で pin (top top, end +=140%, scrub 0.6)
//   - Hero の dolly spacer は scrollY 0..1200 で消える設計なので、本セクションが
//     pin に入る瞬間 (scrollY=1200) には Hero は display:none。よって「Hero が
//     全部消えてから WorksLead が立ち上がる」シーケンスが pin の進捗 0..1 として
//     scroll に bind される
//   - Awwwards 的な「セクションごとに突っかかる」感を出すため、pin 範囲 140vh で
//     globe → sublabel → headline (line stagger) → stats badge → chips (stagger)
//     → count をスクラブ駆動で順次 reveal
//
// 視覚要素:
//   - 左: copy + Cloudflare スタックチップ群 (Cloudflare で個人プロダクトを出荷
//          している Product Engineer + 6 services)
//   - 右: Globe (Three.js wireframe sphere + Cloudflare orange 都市ドット + arc)
const WorksLead: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const globe = container.querySelector('[data-lead-globe]');
            const subLabel = container.querySelector('[data-lead-sublabel]');
            const headlineLines = container.querySelectorAll(
                '[data-lead-line]',
            );
            const statsBadge = container.querySelector('[data-lead-statbadge]');
            const stats = container.querySelectorAll('[data-lead-stat]');
            const statsCount = container.querySelector('[data-lead-statcount]');
            const pinTarget =
                container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: '+=140%',
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.6,
                    invalidateOnRefresh: true,
                },
            });

            // 0.0..0.05: 余白 (Hero 完全消失を見届ける一拍)
            // 0.05..0.40: globe フェードイン
            tl.to(
                globe,
                { opacity: 1, duration: 0.35, ease: 'power2.out' },
                0.05,
            );
            // 0.20..0.45: sublabel
            tl.to(
                subLabel,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                },
                0.2,
            );
            // 0.30..0.65: 見出し 2 行 stagger
            tl.to(
                headlineLines,
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.45,
                    ease: 'power3.out',
                },
                0.3,
            );
            // 0.55..0.70: Stack バッジ
            tl.to(
                statsBadge,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                },
                0.55,
            );
            // 0.60..0.85: 6 件のスタックチップ stagger
            tl.to(
                stats,
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.04,
                    duration: 0.4,
                    ease: 'power2.out',
                },
                0.6,
            );
            // 0.85..1.0: 集計行 (06 services in production)
            tl.to(
                statsCount,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                },
                0.85,
            );
        },
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100vh' : '240vh' }}
        >
            <div
                data-pin-inner
                className="relative w-full h-screen overflow-hidden bg-background flex items-center"
            >
                <div className="absolute top-6 left-6 md:top-8 md:left-12 z-10">
                    <CornerLabel label="WORKS" id="01" />
                </div>
                <div
                    aria-hidden
                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block z-10 font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40"
                    style={{ writingMode: 'vertical-rl' }}
                >
                    GLOBAL EDGE / 220+ POPS
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-10 md:gap-16">
                    {/* 左 (mobile: 下): copy + stats */}
                    <div className="order-2 md:order-1">
                        <p
                            data-lead-sublabel
                            data-reveal
                            className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-5 flex items-center gap-3"
                        >
                            <span className="text-accent">+</span>
                            <span>Global Edge / Solo Shipper</span>
                        </p>
                        <h2 className="font-sans font-bold text-foreground text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-tight max-w-xl">
                            <span
                                data-lead-line
                                data-reveal
                                className="block"
                            >
                                Cloudflare で個人プロダクトを
                            </span>
                            <span
                                data-lead-line
                                data-reveal
                                className="block"
                            >
                                出荷している Product Engineer。
                            </span>
                        </h2>

                        {/* Cloudflare Stack stats */}
                        <div className="mt-10">
                            <p
                                data-lead-statbadge
                                data-reveal
                                className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-3"
                            >
                                <span className="text-accent">+</span>
                                <span>Cloudflare Stack — In Production</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {CLOUDFLARE_SERVICES.map((s) => (
                                    <span
                                        key={s}
                                        data-lead-stat
                                        data-reveal
                                        className="font-mono text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 border border-foreground/15 text-foreground/85"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <p
                                data-lead-statcount
                                data-reveal
                                className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 tabular-nums"
                            >
                                {String(CLOUDFLARE_SERVICES.length).padStart(2, '0')}{' '}
                                services · solo-shipped
                            </p>
                        </div>
                    </div>

                    {/* 右 (mobile: 上): Globe.
                        親 DOM の CSS scale は R3F Canvas の getBoundingClientRect を破壊するので、
                        wrapper には opacity しか当てない。GSAP scrub で opacity 0→1。
                        初期 opacity:0 はインラインで指定 (data-reveal の translateY を避ける)。 */}
                    <div
                        data-lead-globe
                        style={{ opacity: 0 }}
                        className="order-1 md:order-2 flex items-center justify-center"
                    >
                        <GlobeBackground className="w-full max-w-[360px] sm:max-w-[420px] md:max-w-[480px] aspect-square" />
                    </div>
                </div>
            </div>
        </section>
    );
};

// Works = WorksLead (pin scrub 1 行 anchor + globe + Cloudflare stats) +
// AIChatClip pin (FLAGSHIP) + 業務改善 3 本横スクロール (OPS) を縦に並べる。
// 各サブセクションが内部で data-section / pin / scrub を別々に持つ。
export const WorksSection: React.FC = () => {
    return (
        <>
            <WorksLead />
            <WorksFlagshipPart />
            <DividerMarker py={48} />
            <WorksOpsCarousel />
        </>
    );
};
