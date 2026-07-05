interface Props {
    /** true なら 1 本の太いラインが画面上→下を 4s で走査 */
    moving?: boolean;
    opacity?: number;
    /** 静的時の行高 (px) */
    lineSize?: number;
    className?: string;
}

// 静的: repeating-linear-gradient で薄い水平ストライプ
// moving:  global.css の @keyframes scan-down で 1 本の太いラインを縦走査
export const ScanLines: React.FC<Props> = ({
    moving = false,
    opacity = 0.04,
    lineSize = 4,
    className,
}) => {
    if (moving) {
        return (
            <div
                aria-hidden
                className={`absolute inset-0 pointer-events-none overflow-hidden ${className ?? ''}`}
                style={{ opacity }}
            >
                <div
                    className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-foreground to-transparent"
                    style={{
                        top: 0,
                        animation: 'scan-down 3.5s linear infinite',
                        willChange: 'transform',
                    }}
                />
            </div>
        );
    }
    const half = lineSize / 2;
    return (
        <div
            aria-hidden
            className={`absolute inset-0 pointer-events-none ${className ?? ''}`}
            style={{
                opacity,
                backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${half}px, var(--color-foreground) ${half}px ${lineSize}px)`,
            }}
        />
    );
};
