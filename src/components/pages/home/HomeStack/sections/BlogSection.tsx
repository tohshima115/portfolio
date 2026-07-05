import { useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { GridLayer } from '../visuals/GridLayer';
import { SectionFrame } from '../visuals/SectionFrame';
import { MediaFrame } from '../primitives/MediaFrame';

// BlogSection = WorksSection と全く同じ構造の独立 pin セクション。
// "BLOG" タイトルの先出し → pin発生でミニラベル化 + カードせり上がり →
// 最新の投稿を pin中スクロールでクロスフェード。
// サムネイル画像はまだ無いため、MediaFrame の抽象プレースホルダー表示を使う。

export interface BlogPostItem {
    slug: string;
    title: string;
    description: string;
    pubDate: string; // ISO string
}

interface Props {
    posts: BlogPostItem[];
}

const BLOG_PIN_SCROLL_VH = 320;
const BLOG_PIN_HEIGHT_VH = 100;
const BLOG_SECTION_MIN_HEIGHT_VH = BLOG_PIN_SCROLL_VH + BLOG_PIN_HEIGHT_VH;

const HOLD = 0.22;
const TRANS = 0.09;

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const BlogSection: React.FC<Props> = ({ posts }) => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    useScrollScene(containerRef, {
        disabled: reduced || posts.length === 0,
        deps: [posts.length],
        setup: ({ gsap, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            const bigTitle = container.querySelector('[data-blog-bigtitle]');
            const miniLabel = container.querySelector('[data-blog-minilabel]');
            const mediaWrapper = container.querySelector('[data-media-wrapper]');
            const stages = container.querySelectorAll<HTMLElement>('[data-media-stage]');

            gsap.set(mediaWrapper, { yPercent: 100 });
            gsap.set(stages, { opacity: 0, y: 18 });
            stages.forEach((el) => {
                el.style.pointerEvents = 'none';
            });
            gsap.set(miniLabel, { y: -8 });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: `+=${BLOG_PIN_SCROLL_VH}%`,
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.6,
                    invalidateOnRefresh: true,
                },
            });

            tl.to(bigTitle, { opacity: 0, duration: 0.08, ease: 'power2.out' }, 0);
            tl.to(miniLabel, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.02);
            tl.to(mediaWrapper, { yPercent: 0, duration: 0.14, ease: 'power3.out' }, 0);

            const first = stages[0];
            if (first) {
                tl.to(first, { opacity: 1, y: 0, duration: 0.1, ease: 'power3.out' }, 0.08);
                tl.call(() => { first.style.pointerEvents = 'auto'; }, undefined, 0.08);
            }

            let cursor = 0.12 + HOLD;
            for (let i = 1; i < stages.length; i++) {
                const prev = stages[i - 1];
                const cur = stages[i];
                const outAt = cursor;
                const inAt = cursor + 0.02;
                tl.to(prev, { opacity: 0, y: -18, duration: TRANS, ease: 'power2.in' }, outAt);
                tl.call(() => { prev.style.pointerEvents = 'none'; }, undefined, outAt);
                tl.to(cur, { opacity: 1, y: 0, duration: TRANS, ease: 'power3.out' }, inAt);
                tl.call(() => { cur.style.pointerEvents = 'auto'; }, undefined, inAt);
                cursor += TRANS + HOLD;
            }
            tl.to({}, { duration: 0.15 }, cursor);
        },
    });

    if (posts.length === 0) return null;

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100svh' : `${BLOG_SECTION_MIN_HEIGHT_VH}vh` }}
        >
            <div
                data-pin-inner
                className="relative w-full h-[100svh] overflow-hidden bg-background isolate"
            >
                <GridLayer size={32} opacity={0.04} />
                <SectionFrame inset={32} />

                {!reduced && (
                    <>
                        <div
                            data-blog-bigtitle
                            className="absolute inset-0 z-10 flex items-center justify-center px-6"
                        >
                            <span className="block font-sans font-black uppercase tracking-tight text-foreground/90 text-[clamp(2rem,10svh,4rem)] md:text-[clamp(3rem,9vw,7.5rem)] leading-none">
                                Blog
                            </span>
                        </div>

                        <div
                            data-blog-minilabel
                            style={{ opacity: 0 }}
                            className="absolute top-28 md:top-32 inset-x-0 z-20 flex items-center justify-center gap-4 px-6"
                        >
                            <span aria-hidden className="h-px bg-foreground/30 flex-1 max-w-[120px]" />
                            <p className="font-mono text-2xs md:text-xs uppercase tracking-[0.5em] text-muted-foreground whitespace-nowrap">
                                <span className="text-accent">+</span>
                                <span className="ml-3">Blog</span>
                            </p>
                            <span aria-hidden className="h-px bg-foreground/30 flex-1 max-w-[120px]" />
                        </div>

                        <div data-media-wrapper className="absolute inset-0 z-30">
                            {posts.map((post, i) => (
                                <MediaFrame
                                    key={post.slug}
                                    stageId={post.slug}
                                    media={{ type: 'placeholder' }}
                                    eyebrow={`Post ${String(i + 1).padStart(2, '0')} / ${formatDate(post.pubDate)}`}
                                    title={post.title}
                                    description={post.description}
                                    ctaLabel="続きを読む"
                                    ctaHref={`/blog/${post.slug}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {reduced && <ReducedFallback posts={posts} />}
        </section>
    );
};

// reduced-motion 用 static fallback
const ReducedFallback: React.FC<{ posts: BlogPostItem[] }> = ({ posts }) => (
    <div className="relative px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
            <p className="font-mono text-2xs uppercase tracking-[0.5em] text-muted-foreground mb-2">
                <span className="text-accent">+</span>
                <span className="ml-3">Blog</span>
            </p>
            {posts.map((post) => (
                <article key={post.slug} className="border-l-2 border-accent/40 pl-6">
                    <p className="font-mono text-2xs uppercase tracking-[0.5em] text-muted-foreground mb-2">
                        {formatDate(post.pubDate)}
                    </p>
                    <h3 className="font-sans font-bold text-foreground text-3xl mb-3">
                        {post.title}
                    </h3>
                    <p className="text-foreground/80 leading-relaxed mb-4">{post.description}</p>
                    <a
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground hover:text-accent transition-colors"
                    >
                        <span>続きを読む</span>
                        <span aria-hidden>→</span>
                    </a>
                </article>
            ))}
        </div>
    </div>
);
