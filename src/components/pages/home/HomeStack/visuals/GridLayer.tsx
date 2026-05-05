interface Props {
    /** グリッドピッチ (px) */
    size?: number;
    opacity?: number;
    color?: string;
    className?: string;
    /** 中央から外周にかけて薄れる radial mask */
    fade?: boolean;
}

// CSS linear-gradient ベースの軽量グリッド。各セクション背景に敷く。
// 動的アニメは持たないため GPU コストはほぼゼロ。
export const GridLayer: React.FC<Props> = ({
    size = 32,
    opacity = 0.06,
    color = 'var(--color-foreground)',
    className,
    fade = false,
}) => {
    const mask = fade
        ? 'radial-gradient(ellipse at center, black 0%, black 55%, transparent 100%)'
        : undefined;
    return (
        <div
            aria-hidden
            className={`absolute inset-0 pointer-events-none ${className ?? ''}`}
            style={{
                opacity,
                backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
                backgroundSize: `${size}px ${size}px`,
                WebkitMaskImage: mask,
                maskImage: mask,
            }}
        />
    );
};
