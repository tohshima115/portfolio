interface Props {
    className?: string;
    py?: number; // 上下 padding (px)
}

// セクション境界に置く SF ディバイダ。中央に縦線 + 両側コーナー切り欠き + accent +。
export const DividerMarker: React.FC<Props> = ({ className, py = 32 }) => {
    return (
        <div
            aria-hidden
            className={`relative w-full flex items-center justify-center ${className ?? ''}`}
            style={{ paddingTop: py, paddingBottom: py }}
        >
            <svg width="120" height="24" viewBox="0 0 120 24">
                <line
                    x1="0"
                    y1="12"
                    x2="48"
                    y2="12"
                    stroke="var(--color-foreground)"
                    strokeOpacity="0.2"
                />
                <line
                    x1="72"
                    y1="12"
                    x2="120"
                    y2="12"
                    stroke="var(--color-foreground)"
                    strokeOpacity="0.2"
                />
                <line
                    x1="56"
                    y1="4"
                    x2="56"
                    y2="20"
                    stroke="var(--color-foreground)"
                    strokeOpacity="0.4"
                />
                <line
                    x1="64"
                    y1="4"
                    x2="64"
                    y2="20"
                    stroke="var(--color-foreground)"
                    strokeOpacity="0.4"
                />
                <text
                    x="60"
                    y="16"
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--color-accent)"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                    +
                </text>
            </svg>
        </div>
    );
};
