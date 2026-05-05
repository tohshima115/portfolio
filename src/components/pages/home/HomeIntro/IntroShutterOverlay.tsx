interface Props {
    /** 0..1 の進捗 */
    progress: number;
    reducedMotion: boolean;
}

// 案 B: 上下からアイリス・シャッターが閉じてくる。
// progress 0 → 1 で:
//   - 上端から背景色のシャッターが下方向に進捗 * 50vh まで伸びる
//   - 下端から背景色のシャッターが上方向に進捗 * 50vh まで伸びる
//   - シャッターの境界 (Hero との境目) に accent 色の細いラインが光る
//   - 中央に initial スリット (進捗 0 の時だけ accent line) が小さく光って「ここから閉じる」を示唆
//   - 上端 progress bar + 中央上 [TRANSFER NN%] HUD
// progress 1.0 で画面は完全に背景色 → 短い flash → Statement
// reducedMotion 環境では一切描画しない (親 HomeIntro が即時 phase 切替する)。

export const IntroShutterOverlay: React.FC<Props> = ({
    progress,
    reducedMotion,
}) => {
    if (reducedMotion) return null;

    const armed = progress > 0.02;
    const pct = Math.min(100, Math.round(progress * 100));
    const complete = progress >= 1;
    const halfVh = progress * 50;

    return (
        <div
            aria-hidden
            className="absolute inset-0 z-[6] pointer-events-none overflow-hidden"
        >
            {/* === 上シャッター: 上端から下に伸びる === */}
            <div
                className="absolute left-0 right-0 top-0 bg-background"
                style={{
                    height: `${halfVh}vh`,
                    borderBottom: armed ? '1px solid var(--color-accent)' : 'none',
                    boxShadow: armed
                        ? '0 2px 24px rgba(218, 178, 64, 0.35), 0 1px 4px rgba(218, 178, 64, 0.5)'
                        : undefined,
                    willChange: 'height',
                }}
            />

            {/* === 下シャッター: 下端から上に伸びる === */}
            <div
                className="absolute left-0 right-0 bottom-0 bg-background"
                style={{
                    height: `${halfVh}vh`,
                    borderTop: armed ? '1px solid var(--color-accent)' : 'none',
                    boxShadow: armed
                        ? '0 -2px 24px rgba(218, 178, 64, 0.35), 0 -1px 4px rgba(218, 178, 64, 0.5)'
                        : undefined,
                    willChange: 'height',
                }}
            />

            {/* === 中央 initial スリット: armed 前に「ここから閉じる」を示唆 === */}
            {progress < 0.04 && (
                <div
                    className="absolute left-1/4 right-1/4 top-1/2 -translate-y-1/2 h-px"
                    style={{
                        backgroundColor: 'var(--color-accent)',
                        opacity: progress > 0 ? 1 : 0.4,
                        boxShadow: '0 0 16px var(--color-accent), 0 0 4px var(--color-accent)',
                        transition: 'opacity 200ms ease-out',
                    }}
                />
            )}

            {/* === 上端 progress bar (シャッターより上の z-index) === */}
            <div
                className="absolute top-0 left-0 right-0 h-px bg-accent origin-left"
                style={{
                    transform: `scaleX(${progress})`,
                    willChange: 'transform',
                    zIndex: 2,
                }}
            />

            {/* === 中央上 [TRANSFER NN%] HUD (シャッターより上) === */}
            <div
                className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.4em] flex items-center gap-2"
                style={{
                    opacity: armed ? 1 : 0,
                    transition: 'opacity 200ms ease-out',
                    color: complete
                        ? 'var(--color-accent)'
                        : 'var(--color-foreground)',
                    textShadow: complete
                        ? '0 0 12px var(--color-accent)'
                        : undefined,
                    zIndex: 3,
                }}
            >
                <span className="text-accent">[</span>
                <span>TRANSFER</span>
                <span className="tabular-nums w-[3ch] text-right">
                    {String(pct).padStart(2, '0')}
                </span>
                <span>%</span>
                <span className="text-accent">]</span>
            </div>

            {/* === 下端 readiness markers === */}
            <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60"
                style={{
                    opacity: armed && !complete ? 1 : 0,
                    transition: 'opacity 200ms ease-out',
                    zIndex: 3,
                }}
            >
                <span className={progress > 0.05 ? 'text-foreground' : ''}>
                    SCROLL
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className={progress > 0.5 ? 'text-foreground' : ''}>
                    HOLD
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className={complete ? 'text-accent' : ''}>JUMP</span>
            </div>
        </div>
    );
};
