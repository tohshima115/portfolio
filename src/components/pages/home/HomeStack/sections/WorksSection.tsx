import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CornerLabel } from '../primitives/CornerLabel';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { WorksFlagshipPart } from './WorksFlagshipPart';
import { WorksOpsCarousel } from './WorksOpsCarousel';
import { DividerMarker } from '../visuals/DividerMarker';

// Hero と Flagship の温度差を吸収する 1 行 anchor。
// ~40vh、CornerLabel + 1 行 lead だけ。data-section は付けない (HudOverlay の active section
// 判定は Flagship 以降に任せる)。
const WorksLead: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion();
    const inView = useInView(ref, { once: true, amount: 0.4 });
    return (
        <div ref={ref} className="relative w-full bg-background">
            <div className="relative w-full min-h-[40vh] md:min-h-[45vh] flex items-center px-6 md:px-12 py-16 md:py-20">
                <div className="absolute top-6 left-6 md:top-8 md:left-12">
                    <CornerLabel label="WORKS" id="01" />
                </div>
                <motion.p
                    initial={reduced ? false : { opacity: 0, y: 16 }}
                    animate={
                        inView || reduced
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: 16 }
                    }
                    transition={{
                        duration: 0.7,
                        delay: reduced ? 0 : 0.15,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="font-sans font-bold text-foreground text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-tight max-w-3xl"
                >
                    Cloudflare で個人プロダクトを出荷している Product Engineer。
                </motion.p>
            </div>
        </div>
    );
};

// Works = WorksLead (1 行 anchor) + AIChatClip pin (FLAGSHIP) + 業務改善 3 本横スクロール (OPS) を縦に並べる。
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
