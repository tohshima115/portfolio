interface Props {
    /** 0..1 の進捗 */
    progress: number;
    reducedMotion: boolean;
}

// 案 A: shader 側で等高線が乱れる + UI 側で HUD/WARN/進捗バーを乗せる。
// chromatic aberration や strips drop は無し (shader の乱れが主役)。
// reducedMotion 環境では一切描画しない (親 HomeIntro が即時 phase 切替)。

export const IntroDistortOverlay: React.FC<Props> = ({
    progress,
    reducedMotion,
}) => {
    if (reducedMotion) return null;

    const armed = progress > 0.02;
    const pct = Math.min(100, Math.round(progress * 100));
    const complete = progress >= 1;

    return (
        <div
            aria-hidden
            className="absolute inset-0 z-[6] pointer-events-none overflow-hidden"
        >
            {/* === 上端 progress bar (accent) === */}
            <div
                className="absolute top-0 left-0 right-0 h-px bg-accent origin-left"
                style={{
                    transform: `scaleX(${progress})`,
                    willChange: 'transform',
                }}
            />

            {/* === 中央上 HUD カウンタ === */}
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

            {/* === 四隅 WARN マーカー (armed で点滅開始) === */}
            <CornerWarn position="top-left" armed={armed} complete={complete} />
            <CornerWarn position="top-right" armed={armed} complete={complete} />
            <CornerWarn position="bottom-left" armed={armed} complete={complete} />
            <CornerWarn position="bottom-right" armed={armed} complete={complete} />

            {/* === 下端 readiness markers === */}
            <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60"
                style={{
                    opacity: armed ? 1 : 0,
                    transition: 'opacity 200ms ease-out',
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

interface CornerWarnProps {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    armed: boolean;
    complete: boolean;
}

const CORNER_STYLES: Record<CornerWarnProps['position'], string> = {
    'top-left': 'top-16 left-6',
    'top-right': 'top-16 right-6',
    'bottom-left': 'bottom-16 left-6',
    'bottom-right': 'bottom-16 right-6',
};

const CornerWarn: React.FC<CornerWarnProps> = ({ position, armed, complete }) => {
    return (
        <div
            className={`absolute ${CORNER_STYLES[position]} flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em]`}
            style={{
                opacity: armed ? 1 : 0,
                transition: 'opacity 200ms ease-out',
                color: complete ? 'var(--color-accent)' : 'oklch(0.65 0.22 25)',
                animation: armed ? 'warn-blink 0.9s ease-in-out infinite' : undefined,
                willChange: armed ? 'opacity' : undefined,
            }}
        >
            <span
                className="inline-block w-1.5 h-1.5"
                style={{
                    backgroundColor: complete
                        ? 'var(--color-accent)'
                        : 'oklch(0.65 0.22 25)',
                }}
            />
            <span>WARN</span>
        </div>
    );
};
