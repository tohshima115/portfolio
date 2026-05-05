interface Props {
    label: string;
    id?: string;
    suffix?: React.ReactNode;
    className?: string;
}

// `+ STATEMENT / 01` 形式の共通ラベル。各セクション左上に配置する。
export const CornerLabel: React.FC<Props> = ({
    label,
    id,
    suffix,
    className,
}) => {
    return (
        <span
            className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground ${className ?? ''}`}
        >
            <span className="text-accent">+</span>
            <span>{label}</span>
            {id && <span className="text-muted-foreground/60">/ {id}</span>}
            {suffix && <span className="text-muted-foreground/60">{suffix}</span>}
        </span>
    );
};
