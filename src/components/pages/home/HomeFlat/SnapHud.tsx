import { AnimatePresence, motion } from 'framer-motion';

// 蓄積ゲージ (画面下中央) + セクションインジケータ (右端中央)。
// 旧 HomeScene/index.tsx:542-640 から差分なしで抽出。

interface Props {
    gauge: number; // -1..1 (-1=上方向満タン, +1=下方向満タン)
    sectionIndex: number;
    sectionCount: number;
    onJump: (i: number) => void;
}

const CIRCLE_R = 18;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R;

export const SnapHud: React.FC<Props> = ({
    gauge,
    sectionIndex,
    sectionCount,
    onJump,
}) => {
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
