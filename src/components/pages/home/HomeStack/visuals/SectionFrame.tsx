interface Props {
    inset?: number; // px from edges
    size?: number; // corner mark size in px
    color?: string;
    className?: string;
}

// 4 隅にコーナーマーカー (L 字) を配置する SVG オーバーレイ。
// pointer-events-none / aria-hidden。
export const SectionFrame: React.FC<Props> = ({
    inset = 16,
    size = 14,
    color = 'currentColor',
    className,
}) => {
    const path = (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <polyline
                points={`0,${size} 0,0 ${size},0`}
                fill="none"
                stroke={color}
                strokeWidth={1}
            />
        </svg>
    );
    return (
        <div
            aria-hidden
            className={`pointer-events-none absolute text-foreground/30 ${className ?? ''}`}
            style={{ top: inset, left: inset, right: inset, bottom: inset }}
        >
            <div className="absolute" style={{ top: 0, left: 0 }}>
                {path}
            </div>
            <div className="absolute" style={{ top: 0, right: 0, transform: 'rotate(90deg)' }}>
                {path}
            </div>
            <div className="absolute" style={{ bottom: 0, right: 0, transform: 'rotate(180deg)' }}>
                {path}
            </div>
            <div className="absolute" style={{ bottom: 0, left: 0, transform: 'rotate(270deg)' }}>
                {path}
            </div>
        </div>
    );
};
