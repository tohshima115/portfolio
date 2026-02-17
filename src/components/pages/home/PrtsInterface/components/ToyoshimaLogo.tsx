import React, { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';

// === アニメーション設定 (相対時間設定) ===
// 各フェーズの duration (所要時間) と wait (直前のフェーズ終了からの待機時間) を定義します。
const ANIMATION_CONFIG = {
    // [Phase 1: 中央セルの明滅 (Center Blink)]
    blinkDuration: 0.3,

    // [Phase 2: マスクの拡大 (Mask Expand)]
    // 明滅終了 後、どれくらい待ってから拡大を始めるか
    expandWait: 0.4,
    expandDuration: 1.6,

    // [Phase 3: 上段左右の塗りつぶし (Side Fill)]
    // マスク拡大終了 後、どれくらい待ってから塗りつぶしを始めるか
    fillWait: 1.0,
    fillDuration: 0.3,
    fillStagger: 0.1, // 左右の時差

    // [Phase 4: 中央列のドロップダウン (Center Drop)]
    // 左右の塗りつぶし終了 後、どれくらい待ってからドロップするか
    dropWait: 0.0,
    dropDuration: 0.8
} as const;

// イージング設定 (Easing Functions)
const EASING = {
    fill: "circOut",
    drop: [0.22, 1, 0.36, 1], // カスタムベジェ曲線 (expandにも使用)
} as const;

interface ToyoshimaLogoProps {
    unit?: number;
    className?: string;
    /** アニメーション全体の開始遅延 (秒) */
    initialDelay?: number;
    /** Phase 3 (塗りつぶし) 以降の開始タイミングに対する追加遅延 (秒) */
    phase3Delay?: number;
}

export const ToyoshimaLogo = ({
    unit = 4,
    className = "",
    initialDelay = 0,
    phase3Delay = 0
}: ToyoshimaLogoProps) => {
    const SIZE = unit * 5;
    const GAP = unit * 3;
    const BORDER = unit * 1;

    // タイミング計算 (Absolute delays calculated from relative config & props)
    const timing = useMemo(() => {
        // Phase 1: Blink
        // Start: initialDelay
        // End:   Start + duration
        const t1_Start = initialDelay;
        const t1_End = t1_Start + ANIMATION_CONFIG.blinkDuration;

        // Phase 2: Expand
        // Start: Phase 1 End + Wait
        // End:   Start + duration
        const t2_Start = t1_End + ANIMATION_CONFIG.expandWait;
        const t2_End = t2_Start + ANIMATION_CONFIG.expandDuration;

        // Phase 3: Fill (Side)
        // Start: Phase 2 End + Wait + PropDelay
        // End:   Start + duration + stagger (最後の要素が終わる時間)
        // Staggerは index 0, 2 の2つ。2番目が終わる時間 = Start + stagger + duration
        const t3_Start = t2_End + ANIMATION_CONFIG.fillWait + phase3Delay;
        const t3_End = t3_Start + ANIMATION_CONFIG.fillStagger + ANIMATION_CONFIG.fillDuration;

        // Phase 4: Drop (Center)
        // Start: Phase 3 End + Wait
        const t4_Start = t3_End + ANIMATION_CONFIG.dropWait;

        return {
            blink: t1_Start,
            expand: t2_Start,
            fill: t3_Start,
            drop: t4_Start
        };
    }, [initialDelay, phase3Delay]);

    // コンテナ：マスクアニメーション
    const containerVariants: Variants = {
        hidden: {
            clipPath: "inset(25% 25% 25% 25%)",
        },
        visible: {
            clipPath: "inset(-3% -3% -3% -3%)",
            transition: {
                delay: timing.expand, // 計算された絶対時間
                duration: ANIMATION_CONFIG.expandDuration,
                ease: EASING.drop as any // ユーザー指定のベジェを使用
            }
        }
    };

    // 中央セル (Index 4): 明滅
    const centerBlinkVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: [0, 0, 1, 1, 0, 0, 1, 1],
            transition: {
                duration: ANIMATION_CONFIG.blinkDuration,
                times: [0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1],
                ease: "linear",
                delay: timing.blink // 計算された絶対時間
            }
        }
    };

    // 左右セル (Index 0, 2): 塗りつぶし
    const fillSideVariants: Variants = {
        hidden: { scaleY: 0, originY: 0 },
        visible: (i: number) => ({
            scaleY: 1,
            transition: {
                duration: ANIMATION_CONFIG.fillDuration,
                ease: EASING.fill,
                // fillStart + indexに応じたstagger
                // iは 0(1番) または 2(3番)。staggerを適用するのは 2 の場合のみと仮定、あるいは i * stagger。
                // 3番目は i=2 なので 2*stagger になるが、要素は2つだけ(0, 2)。
                // 0 -> 0, 2 -> 1*stagger としたいなら工夫が必要だが、ここではシンプルに i * 0.5 * stagger ?
                // ユーザーコードは fillSideStart + (i === 0 ? 0 : fillSideStagger) だった。
                delay: timing.fill + (i === 0 ? 0 : ANIMATION_CONFIG.fillStagger)
            }
        })
    };

    // 中央上セル (Index 1): ドロップダウン
    const dropCenterVariants: Variants = {
        hidden: { height: 0 },
        visible: {
            height: (SIZE * 3) + (GAP * 2),
            transition: {
                delay: timing.drop,
                duration: ANIMATION_CONFIG.dropDuration,
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
            style={{ gap: GAP, willChange: "clip-path" }}
            variants={containerVariants}
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
