/**
 * Works ハブ/章ページの本文 (MDX) 用 prose クラス。
 * 旧デザインの黄色マーカー・uppercase 見出しは廃止し、
 * TOP のトーン (墨色 + mono マイクロラベル + 控えめな accent) に揃える。
 */
export const WORK_PROSE_CLASS = [
    'prose prose-neutral max-w-none font-sans',
    'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
    'prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-2 prose-h2:border-b prose-h2:border-foreground/10',
    'prose-h3:text-base md:prose-h3:text-lg prose-h3:mt-9 prose-h3:mb-3',
    'prose-h4:text-base prose-h4:mt-6',
    'prose-p:text-foreground/80 prose-p:leading-relaxed',
    'prose-strong:text-foreground prose-strong:font-bold',
    'prose-li:text-foreground/80 prose-li:marker:text-muted-foreground',
    'prose-a:text-foreground prose-a:underline prose-a:decoration-accent prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:text-accent-foreground hover:prose-a:bg-accent',
    'prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-blockquote:font-normal',
    'prose-table:text-sm',
    'prose-code:font-mono prose-code:text-[0.85em]',
    'prose-pre:rounded-xl prose-pre:border prose-pre:border-foreground/10',
].join(' ');
