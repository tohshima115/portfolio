import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { msToS, type LogoTimingProfile } from '../config/animationTiming';

// イージング設定 (Easing Functions)
const EASING = {
    fill: "circOut",
    drop: [0.83, 0, 0.17, 1], // カスタムベジェ曲線 (var(--ease-in-out-quint) 同等)
} as const;

interface ToyoshimaLogoProps {
    unit?: number;
    className?: string;
    timingProfile: LogoTimingProfile;
}

export const ToyoshimaLogo = ({
    unit = 4,
    className = "",
    timingProfile
}: ToyoshimaLogoProps) => {
    const SIZE = unit * 5;
    const GAP = unit * 3;
    const BORDER = unit * 1;



    // 中央セル (Index 4): 明滅
    const centerBlinkVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: [0, 0, 1, 1, 0, 0, 1, 1],
            transition: {
                duration: msToS(timingProfile.blink.duration),
                times: [0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1],
                ease: "linear",
                delay: msToS(timingProfile.blink.start)
            }
        }
    };

    // 左右セル (Index 0, 2): 塗りつぶし
    const fillSideVariants: Variants = {
        hidden: { scaleY: 0, originY: 0 },
        visible: (i: number) => ({
            scaleY: 1,
            transition: {
                duration: msToS(timingProfile.fill.duration),
                ease: EASING.fill,
                delay: msToS(timingProfile.fill.start) + (i === 0 ? 0 : msToS(timingProfile.fill.stagger))
            }
        })
    };

    // 中央上セル (Index 1): ドロップダウン
    const dropCenterVariants: Variants = {
        hidden: { height: 0 },
        visible: {
            height: (SIZE * 3) + (GAP * 2),
            transition: {
                delay: msToS(timingProfile.drop.start),
                duration: msToS(timingProfile.drop.duration),
                ease: EASING.drop as any
            }
        }
    };

    const cellStyle = {
        width: SIZE,
        height: SIZE,
        borderWidth: BORDER,
        borderColor: 'var(--color-logo)',
        boxSizing: 'border-box' as const,
    };

    const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    return (
        <motion.div
            className={`relative grid grid-cols-3 ${className}`}
            style={{
                gap: GAP,
                willChange: "clip-path",
                // clipPath アニメーションを CSS に委譲し、メインスレッドの JS 負荷を削減。
                // framer-motion の JS 駆動だと毎フレーム repaint + JS 実行が必要だが、
                // CSS animation はブラウザのネイティブスケジューラで最適化される。
                animation: `logo-clip-reveal ${msToS(timingProfile.expand.duration)}s var(--ease-in-out-quint) ${msToS(timingProfile.expand.start)}s both`,
            }}
            initial="hidden"
            animate="visible"
        >
            {cells.map((i) => {
                const isTopRow = i < 3;
                const isCenterCell = i === 4;
                const isCenterTop = i === 1;

                if (isCenterCell) {
                    return (
                        <motion.div
                            key={i}
                            variants={centerBlinkVariants}
                            style={cellStyle}
                            className="relative"
                        />
                    );
                }

                if (isTopRow) {
                    return (
                        <motion.div
                            key={i}
                            style={{
                                ...cellStyle,
                                zIndex: isCenterTop ? 20 : 1,
                            }}
                            className="relative"
                        >
                            {!isCenterTop && (
                                <motion.div
                                    className="absolute bg-[var(--color-logo)]"
                                    style={{
                                        top: -BORDER,
                                        left: -BORDER,
                                        width: SIZE,
                                        height: SIZE
                                    }}
                                    variants={fillSideVariants}
                                    custom={i}
                                />
                            )}

                            {isCenterTop && (
                                <motion.div
                                    className="absolute bg-[var(--color-logo)]"
                                    style={{
                                        top: -BORDER,
                                        left: -BORDER,
                                        width: SIZE,
                                    }}
                                    variants={dropCenterVariants}
                                />
                            )}
                        </motion.div>
                    );
                }

                return (
                    <motion.div
                        key={i}
                        style={cellStyle}
                        variants={{ hidden: { opacity: 1 }, visible: { opacity: 1 } }}
                        className="relative"
                    />
                );
            })}
        </motion.div>
    );
};
