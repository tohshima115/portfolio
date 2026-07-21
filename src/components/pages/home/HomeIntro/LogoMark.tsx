import type { CSSProperties } from 'react';
import { motion, type Variants } from 'framer-motion';

// 初回訪問スプラッシュ専用のロゴマーク。
// 旧 ToyoshimaLogo (DOM 版) を踏襲するが、3D 親変換の下で使われることが
// なくなった (= raster 競合を気にする必要がない) ため、SVG 統合版を経由せず
// シンプルな DOM 実装に戻している。

const EASE_DROP = [0.83, 0, 0.17, 1] as const;

// 順序は feat/refine-top-design 当時の MAIN_TITLE_TIMING_MS を踏襲。
// blink → expand (中央から外周へ展開) → fill → drop。この順序が演出の肝で、
// 縮めて fill/drop を先に済ませると「ただ形が出るだけ」の簡素な印象になる。
// 尺は当時の値を約 0.65 倍。順序と間の比率は保ったままテンポだけ上げている。
const TIMING_MS = {
    blinkStart: 60,
    blinkDuration: 200,
    expandStart: 640,
    expandDuration: 640,
    fillStart: 1540,
    fillDuration: 200,
    fillStagger: 70,
    dropStart: 1800,
    dropDuration: 520,
};

export const LOGO_MARK_TOTAL_MS = TIMING_MS.dropStart + TIMING_MS.dropDuration;

const msToS = (ms: number) => ms / 1000;

interface Props {
    unit?: number;
}

export const LogoMark = ({ unit = 9 }: Props) => {
    const SIZE = unit * 5;
    const GAP = unit * 3;
    const BORDER = Math.max(2, unit);

    const centerBlinkVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: [0, 0, 1, 1, 0, 0, 1, 1],
            transition: {
                duration: msToS(TIMING_MS.blinkDuration),
                times: [0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1],
                ease: 'linear',
                delay: msToS(TIMING_MS.blinkStart),
            },
        },
    };

    const fillSideVariants: Variants = {
        hidden: { scaleY: 0 },
        visible: (i: number) => ({
            scaleY: 1,
            transition: {
                duration: msToS(TIMING_MS.fillDuration),
                ease: 'circOut',
                delay: msToS(TIMING_MS.fillStart) + (i === 0 ? 0 : msToS(TIMING_MS.fillStagger)),
            },
        }),
    };

    const dropCenterVariants: Variants = {
        hidden: { height: 0 },
        visible: {
            height: SIZE * 3 + GAP * 2,
            transition: {
                delay: msToS(TIMING_MS.dropStart),
                duration: msToS(TIMING_MS.dropDuration),
                ease: EASE_DROP,
            },
        },
    };

    const cellStyle: CSSProperties = {
        width: SIZE,
        height: SIZE,
        borderWidth: BORDER,
        borderColor: 'var(--color-logo)',
        boxSizing: 'border-box',
    };

    return (
        <motion.div
            className="relative grid grid-cols-3"
            style={{
                gap: GAP,
                animation: `logo-clip-reveal ${msToS(TIMING_MS.expandDuration)}s cubic-bezier(0.83, 0, 0.17, 1) ${msToS(TIMING_MS.expandStart)}s both`,
            }}
            initial="hidden"
            animate="visible"
        >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
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
                        <div
                            key={i}
                            style={{ ...cellStyle, zIndex: isCenterTop ? 2 : 1 }}
                            className="relative"
                        >
                            {!isCenterTop && (
                                <motion.div
                                    className="absolute bg-[var(--color-logo)]"
                                    style={{ top: -BORDER, left: -BORDER, width: SIZE, height: SIZE, transformOrigin: 'top' }}
                                    variants={fillSideVariants}
                                    custom={i}
                                />
                            )}
                            {isCenterTop && (
                                <motion.div
                                    className="absolute bg-[var(--color-logo)]"
                                    style={{ top: -BORDER, left: -BORDER, width: SIZE }}
                                    variants={dropCenterVariants}
                                />
                            )}
                        </div>
                    );
                }

                return <div key={i} style={cellStyle} className="relative" />;
            })}
        </motion.div>
    );
};
