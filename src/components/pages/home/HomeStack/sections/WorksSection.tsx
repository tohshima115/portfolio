import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CornerLabel } from '../primitives/CornerLabel';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { WorksFlagshipPart } from './WorksFlagshipPart';
import { WorksOpsCarousel } from './WorksOpsCarousel';
import { DividerMarker } from '../visuals/DividerMarker';
import { GlobeBackground } from '../visuals/GlobeBackground';

// Hero と Flagship の温度差を吸収する 1 行 anchor + Globe ビジュアル。
// Globe (Three.js wireframe sphere + PoP arcs) で「Cloudflare の global edge」を視覚的に表現し、
// "Cloudflare で個人プロダクトを出荷している Product Engineer" の copy にビジュアル根拠を添える。
//
// reveal シーケンス:
//   1) Hero dolly が完了 (scrollY ~1200) → WorksLead が viewport に入る
//   2) Globe が 0.3s delay で scale + opacity 立ち上げ (1.4s)
//   3) Globe が 8 割表示された頃 (1.0s delay) でテキストが追従して fade-in
// この sequencing で「カメラが引き終わる → 地球儀が現れる → 役割が宣言される」流れを作る。
const WorksLead: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion();
    // amount: 0.35 で section 中盤に達したら発火 (Hero 直後の即発火を避ける)
    const inView = useInView(ref, { once: true, amount: 0.35 });
    return (
        <div ref={ref} className="relative w-full bg-background">
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
            <div className="relative w-full min-h-[70vh] md:min-h-[85vh] flex items-center px-6 md:px-12 py-16 md:py-24">
                <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-12 md:gap-16">
                    {/* Left (mobile: top): text */}
                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 20 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 20 }
                        }
                        transition={{
                            duration: 0.9,
                            delay: reduced ? 0 : 1.0,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="order-2 md:order-1"
                    >
                        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-4 flex items-center gap-3">
                            <span className="text-accent">+</span>
                            <span>Global Edge / Solo Shipper</span>
                        </p>
                        <p className="font-sans font-bold text-foreground text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-tight max-w-xl">
                            Cloudflare で個人プロダクトを出荷している Product Engineer。
                        </p>
                    </motion.div>

                    {/* Right (mobile: top): globe.
                        親 DOM に CSS scale をかけると R3F Canvas の getBoundingClientRect が
                        ズレる (ContourBackground のコメント参照)。よって entrance は opacity のみ。
                        スケール感のある立ち上がりが欲しい場合は Globe 内部で group.scale を
                        animate する形にするのが正解。 */}
                    <motion.div
                        initial={reduced ? false : { opacity: 0 }}
                        animate={
                            inView || reduced ? { opacity: 1 } : { opacity: 0 }
                        }
                        transition={{
                            duration: 1.6,
                            delay: reduced ? 0 : 0.3,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="order-1 md:order-2 flex items-center justify-center"
                    >
                        <GlobeBackground className="w-full max-w-[360px] sm:max-w-[420px] md:max-w-[480px] aspect-square" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// Works = WorksLead (1 行 anchor + globe) + AIChatClip pin (FLAGSHIP) + 業務改善 3 本横スクロール (OPS) を縦に並べる。
// Flagship / Ops は内部で data-section="works" / data-section="works-ops" を別々に持つ。
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
