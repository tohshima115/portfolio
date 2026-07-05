// 親に aria-label, 各 char span は aria-hidden で SR 配慮。
// data-char-index 属性で GSAP timeline 側から個別 stagger を当てやすくする。
// dataAnim=true で data-anim 属性が付き、global.css の隠し初期状態に乗る。

interface Props {
    text: string;
    className?: string;
    charClassName?: string;
    style?: React.CSSProperties;
    /** true なら data-anim 付与 → global.css の [data-anim]>span 隠し初期状態に乗せる */
    dataAnim?: boolean;
}

export const SplitChars: React.FC<Props> = ({
    text,
    className,
    charClassName,
    style,
    dataAnim,
}) => {
    const chars = Array.from(text);
    return (
        <span
            className={className}
            aria-label={text}
            style={style}
            data-split-chars
            data-anim={dataAnim ? '' : undefined}
        >
            {chars.map((ch, i) => (
                <span
                    key={`${i}-${ch}`}
                    aria-hidden="true"
                    className={charClassName}
                    data-char-index={i}
                    style={{ display: 'inline-block' }}
                >
                    {ch === ' ' ? ' ' : ch}
                </span>
            ))}
        </span>
    );
};
