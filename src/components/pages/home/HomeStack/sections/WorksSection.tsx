import { useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { GridLayer } from '../visuals/GridLayer';
import { SectionFrame } from '../visuals/SectionFrame';
import { MediaFrame } from '../primitives/MediaFrame';
import { PROJECTS } from './works/data';

// WorksSection = 独立した pin セクション。
// StackHeroSection と同じ構成トーンで、"WORKS" は常に画面上部に固定表示される
// 太字タイトルとして出しっぱなしにし、その下・中央付近にプロジェクトカードが
// 表示される。pin中はカード内の video/poster + タイトル + 説明 + CTA を、
// スクロールに応じて 3 プロジェクトぶんクロスフェードする。
// 全件見終わったら pin解除し、次の BlogSection へ通常スクロールでつながる。

const WORKS_PIN_SCROLL_VH = 420;
const WORKS_PIN_HEIGHT_VH = 100;
const WORKS_SECTION_MIN_HEIGHT_VH = WORKS_PIN_SCROLL_VH + WORKS_PIN_HEIGHT_VH;

const HOLD = 0.22;
const TRANS = 0.09;

export const WorksSection: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            const stages = container.querySelectorAll<HTMLElement>('[data-media-stage]');

            gsap.set(stages, { opacity: 0, y: 18 });
            stages.forEach((el) => {
                el.style.pointerEvents = 'none';
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: `+=${WORKS_PIN_SCROLL_VH}%`,
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.6,
                    invalidateOnRefresh: true,
                },
            });

            const first = stages[0];
            if (first) {
                tl.to(first, { opacity: 1, y: 0, duration: 0.1, ease: 'power3.out' }, 0);
                tl.call(() => { first.style.pointerEvents = 'auto'; }, undefined, 0);
            }

            // ─── pin中: プロジェクトを順にクロスフェード ───
            let cursor = 0.1 + HOLD;
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
            // 最終カードを見終わってから pin解除までの hold
            tl.to({}, { duration: 0.15 }, cursor);
        },
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100svh' : `${WORKS_SECTION_MIN_HEIGHT_VH}vh` }}
        >
            <div
                data-pin-inner
                className="relative w-full h-[100svh] overflow-hidden bg-background isolate"
            >
                <GridLayer size={32} opacity={0.04} />
                <SectionFrame inset={32} />

                {!reduced && (
                    <div
                        data-hero-layer
                        className="absolute inset-0 z-10 flex items-center"
                    >
                        <div className="relative w-full flex flex-col items-center gap-[3svh] md:gap-10 px-6">
                            <div className="text-center">
                                <span className="block font-sans font-black uppercase tracking-tight text-foreground/90 text-[clamp(1.75rem,9svh,3.5rem)] md:text-[clamp(2.5rem,7vw,5.5rem)] leading-none">
                                    Works
                                </span>
                            </div>

                            <div
                                data-media-wrapper
                                className="relative w-full max-w-5xl h-[42svh] md:h-[58vh]"
                            >
                                {PROJECTS.map((p) => (
                                    <MediaFrame
                                        key={p.id}
                                        stageId={p.id}
                                        media={
                                            p.poster
                                                ? { type: 'video', poster: p.poster, videoSrc: p.videoSrc }
                                                : { type: 'placeholder' }
                                        }
                                        eyebrow={`Project ${p.id} / ${p.meta}`}
                                        title={p.name}
                                        description={p.description}
                                        ctaLabel="詳しくはこちら"
                                        ctaHref={`/works/${p.slug}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {reduced && <ReducedFallback />}
        </section>
    );
};

// reduced-motion 用 static fallback
const ReducedFallback: React.FC = () => (
    <div className="relative px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
            <p className="font-mono text-2xs uppercase tracking-[0.5em] text-muted-foreground mb-2">
                <span className="text-accent">+</span>
                <span className="ml-3">Works</span>
            </p>
            {PROJECTS.map((p) => (
                <article key={p.id} className="border-l-2 border-accent/40 pl-6">
                    <p className="font-mono text-2xs uppercase tracking-[0.5em] text-muted-foreground mb-2">
                        Project {p.id} / {p.meta}
                    </p>
                    <h3 className="font-sans font-bold text-foreground text-3xl mb-3">
                        {p.name}
                    </h3>
                    <p className="text-foreground/80 leading-relaxed mb-4">{p.description}</p>
                    <a
                        href={`/works/${p.slug}`}
                        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground hover:text-accent transition-colors"
                    >
                        <span>詳しくはこちら</span>
                        <span aria-hidden>→</span>
                    </a>
                </article>
            ))}
        </div>
    </div>
);
