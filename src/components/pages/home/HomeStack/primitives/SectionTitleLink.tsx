import { ArrowUpRight } from 'lucide-react';

// Works/Blog/About の見出しリンク共通パーツ。
// hover でテキストが少し左へ寄り、右側に矢印アイコンが「にゅっ」と
// 幅を広げながらポップインすることで、遷移先があることを示す。

interface SectionTitleLinkProps {
    href: string;
    children: React.ReactNode;
    /** 見出しテキスト側の装飾クラス (フォントサイズ等、呼び出し元ごとに異なる) */
    textClassName: string;
    /** <a> 自体に足す追加クラス (margin 等) */
    className?: string;
    iconSize?: number;
}

export const SectionTitleLink: React.FC<SectionTitleLinkProps> = ({
    href,
    children,
    textClassName,
    className = '',
    iconSize = 28,
}) => (
    <a href={href} className={`group inline-flex items-center cursor-pointer ${className}`}>
        <span
            className={`${textClassName} transition-transform duration-300 ease-out group-hover:-translate-x-1 group-hover:text-accent`}
        >
            {children}
        </span>
        <span
            className="inline-block overflow-hidden max-w-0 transition-[max-width] duration-300 ease-out group-hover:max-w-[var(--icon-max-w)]"
            style={{ '--icon-max-w': `${iconSize + 12}px` } as React.CSSProperties}
        >
            <ArrowUpRight
                aria-hidden
                size={iconSize}
                className="ml-1.5 shrink-0 text-accent opacity-0 -translate-x-1 scale-75 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100"
            />
        </span>
    </a>
);
