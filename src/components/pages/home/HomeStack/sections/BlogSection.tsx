import { useRef } from 'react';
import type { ImageMetadata } from 'astro';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { SectionFrame } from '../visuals/SectionFrame';
import { MediaVisual } from '../primitives/MediaFrame';

// BlogSection = WorksSection と全く同じ構成トーンの独立 pin セクション。
// "BLOG" は常に画面上部に固定表示される太字タイトルとして出しっぱなしにし、
// メディア枠 (サムネイル未設定の記事は抽象プレースホルダーにフォールバック) とテキストは
// 別コンポーネントとして分離、pin中は枠自体はそのまま中身だけがクロスフェードする。
// 初回登場時だけ、枠が画面下から大きくせり上がりながら拡大する entrance を演出する。

export interface BlogPostItem {
    slug: string;
    title: string;
    description: string;
    pubDate: string; // ISO string
    thumbnail?: ImageMetadata;
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

            const mediaFrame = container.querySelector<HTMLElement>('[data-media-frame]');
            const textFrame = container.querySelector<HTMLElement>('[data-text-frame]');
            const mediaStages = container.querySelectorAll<HTMLElement>('[data-media-stage]');
            const textStages = container.querySelectorAll<HTMLElement>('[data-text-stage]');
            const dots = container.querySelectorAll<HTMLElement>('[data-media-dot]');

            const setActiveDot = (id: string) => {
                dots.forEach((dot) => {
                    const active = dot.dataset.mediaId === id;
                    gsap.to(dot, {
                        height: active ? 22 : 6,
                        backgroundColor: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                        duration: 0.3,
                        ease: 'power2.out',
                    });
                });
            };

            // ─── 初期状態: 枠は画面下 70% ぶんはみ出た縮小状態。
            // 1本目のサムネイルだけは枠が小さいうちから既に見えている状態にし、
            // 枠と一緒に拡大させる (テキストと2本目以降の画像は引き続き非表示)。
            gsap.set(mediaFrame, { yPercent: 70, scale: 0.55, transformOrigin: '50% 100%' });
            gsap.set(textFrame, { opacity: 0, y: 16 });
            gsap.set(mediaStages, { opacity: 0 });
            if (mediaStages[0]) gsap.set(mediaStages[0], { opacity: 1 });
            gsap.set(textStages, { opacity: 0, y: 10 });
            gsap.set(dots, { height: 6, backgroundColor: 'rgba(255,255,255,0.4)' });
            textStages.forEach((el) => {
                el.style.pointerEvents = 'none';
            });

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

            // ─── entrance: 枠がせり上がりながら拡大 (往復させず、そのまま止まる) → テキスト ───
            // 1本目のサムネイルは最初から見えているので、ここではフェードインさせない。
            tl.to(mediaFrame, { yPercent: 0, scale: 1, duration: 0.22, ease: 'power3.out' }, 0);
            tl.to(textFrame, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.1);

            const firstText = textStages[0];
            if (firstText) {
                tl.to(firstText, { opacity: 1, y: 0, duration: 0.1, ease: 'power3.out' }, 0.16);
            }

            // ─── pin中: 枠はそのまま、中身 (画像/動画 + テキスト) だけを順にクロスフェード ───
            // どの投稿が「現在アクティブか」は tl.call() の片方向発火に頼らず、
            // 各投稿の活性化しきい値 (activationTimes) と現在の再生位置を毎フレーム
            // 比較して求める。scrub は上下どちらにも動くため、call() を出現方向にだけ
            // 仕込む従来のやり方だと逆再生 (上スクロール) 時にインジケーターが1テンポ
            // 遅れる不具合が起きていた。
            const activationTimes = [0];
            let cursor = 0.22 + HOLD;
            for (let i = 1; i < mediaStages.length; i++) {
                const prevMedia = mediaStages[i - 1];
                const curMedia = mediaStages[i];
                const prevText = textStages[i - 1];
                const curText = textStages[i];
                const outAt = cursor;
                const inAt = cursor + 0.02;

                tl.to(prevMedia, { opacity: 0, duration: TRANS, ease: 'power2.in' }, outAt);
                tl.to(prevText, { opacity: 0, y: -12, duration: TRANS, ease: 'power2.in' }, outAt);

                tl.to(curMedia, { opacity: 1, duration: TRANS, ease: 'power3.out' }, inAt);
                tl.to(curText, { opacity: 1, y: 0, duration: TRANS, ease: 'power3.out' }, inAt);

                activationTimes.push(inAt);
                cursor += TRANS + HOLD;
            }
            // 最終カードを見終わってから pin解除までの hold
            tl.to({}, { duration: 0.15 }, cursor);

            let activeIndex = -1;
            const applyActiveIndex = () => {
                const t = tl.time();
                let idx = 0;
                for (let k = activationTimes.length - 1; k >= 0; k--) {
                    if (t >= activationTimes[k]) { idx = k; break; }
                }
                if (idx === activeIndex) return;
                activeIndex = idx;
                textStages.forEach((el, k) => {
                    el.style.pointerEvents = k === idx ? 'auto' : 'none';
                });
                setActiveDot(posts[idx].slug);
            };
            tl.eventCallback('onUpdate', applyActiveIndex);
            applyActiveIndex();
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
                <SectionFrame inset={32} />

                {!reduced && (
                    <div
                        data-hero-layer
                        className="absolute inset-0 z-10 flex items-center"
                    >
                        <div className="relative w-full flex flex-col items-center gap-[3svh] md:gap-10 px-6">
                            <div className="text-center">
                                <span className="block font-sans font-black uppercase tracking-tight text-foreground/90 text-[clamp(1.75rem,9svh,3.5rem)] md:text-[clamp(2.5rem,7vw,5.5rem)] leading-none">
                                    Blog
                                </span>
                            </div>

                            <div className="relative w-full max-w-5xl">
                                {/* メディア枠: 常設。中の画像/動画だけが切り替わる */}
                                <div
                                    data-media-frame
                                    className="relative w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-foreground/15 bg-foreground/[0.03]"
                                >
                                    {posts.map((post) => (
                                        <div
                                            key={post.slug}
                                            data-media-stage
                                            data-media-id={post.slug}
                                            className="absolute inset-0"
                                        >
                                            <MediaVisual
                                                media={
                                                    post.thumbnail
                                                        ? { type: 'image', src: post.thumbnail }
                                                        : { type: 'placeholder' }
                                                }
                                            />
                                        </div>
                                    ))}

                                    {/* 現在地インジケーター: 何件中の何件目かをスライド風に示す */}
                                    <div
                                        aria-hidden
                                        className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2 md:gap-2.5"
                                    >
                                        {posts.map((post) => (
                                            <span
                                                key={post.slug}
                                                data-media-dot
                                                data-media-id={post.slug}
                                                className="block w-1.5 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* テキスト枠: メディアとは分離、下に一段スペースを空けて配置 */}
                                <div
                                    data-text-frame
                                    className="relative w-full mt-5 md:mt-8 min-h-[8.5rem] md:min-h-[9.5rem]"
                                >
                                    {posts.map((post, i) => (
                                        <div
                                            key={post.slug}
                                            data-text-stage
                                            data-media-id={post.slug}
                                            className="absolute inset-x-0 top-0 flex flex-col items-start gap-2 md:gap-3"
                                        >
                                            <p className="font-mono text-2xs md:text-xs uppercase tracking-[0.4em] text-muted-foreground">
                                                <span className="text-accent">+</span>
                                                <span className="ml-3">{`Post ${String(i + 1).padStart(2, '0')} / ${formatDate(post.pubDate)}`}</span>
                                            </p>
                                            <h3 className="font-sans font-black text-foreground text-[clamp(1.5rem,4vw,2.75rem)] leading-tight tracking-tight">
                                                {post.title}
                                            </h3>
                                            <p className="font-sans text-xs md:text-sm text-foreground/70 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-3">
                                                {post.description}
                                            </p>
                                            <a
                                                href={`/blog/${post.slug}`}
                                                className="mt-1 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground border border-foreground/20 px-4 py-2 hover:border-accent hover:text-accent transition-colors"
                                            >
                                                <span>続きを読む</span>
                                                <span aria-hidden>→</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
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
