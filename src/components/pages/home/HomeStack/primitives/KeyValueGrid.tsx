import { Fragment } from 'react';

interface Item {
    key: string;
    value: React.ReactNode;
}

interface Props {
    items: Item[];
    className?: string;
}

// PRTS 風の k/v リスト。dt は左に縦罫 + uppercase mono、dd は通常文字。
// 業務改善横スクロールの各ペイン (Role / Stack / Trigger / Status) で使用。
export const KeyValueGrid: React.FC<Props> = ({ items, className }) => {
    return (
        <dl
            className={`grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 font-mono text-xs ${className ?? ''}`}
        >
            {items.map((it) => (
                <Fragment key={it.key}>
                    <dt className="uppercase tracking-[0.25em] text-muted-foreground border-l border-foreground/30 pl-3 self-start">
                        {it.key}
                    </dt>
                    <dd className="text-foreground/90 leading-relaxed">{it.value}</dd>
                </Fragment>
            ))}
        </dl>
    );
};
