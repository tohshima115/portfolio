// 親に aria-label, 各 char span は aria-hidden で SR 配慮。
// data-char-index 属性で GSAP timeline 側から個別 stagger を当てやすくする。
//
// Array.from(text) で grapheme 単位に分割し、半角空白は &nbsp; ( ) に置換して
// inline-block 維持。

interface Props {
    text: string;
    className?: string;
    charClassName?: string;
    style?: React.CSSProperties;
}

export const SplitChars: React.FC<Props> = ({
    text,
    className,
    charClassName,
    style,
}) => {
    const chars = Array.from(text);
    return (
        <span
            className={className}
            aria-label={text}
            style={style}
            data-split-chars
        >
            {chars.map((ch, i) => (
                <span
                    key={`${i}-${ch}`}
                    aria-hidden="true"
                    className={charClassName}
                    data-char-index={i}
                    style={{ display: 'inline-block', willChange: 'transform, opacity' }}
                >
                    {ch === ' ' ? ' ' : ch}
                </span>
            ))}
        </span>
    );
};
