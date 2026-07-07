import { useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { GridLayer } from '../visuals/GridLayer';
import { SectionFrame } from '../visuals/SectionFrame';
import { MediaVisual } from '../primitives/MediaFrame';
import { PROJECTS } from './works/data';

// WorksSection = 独立した pin セクション。
// StackHeroSection と同じ構成トーンで、"WORKS" は常に画面上部に固定表示される
// 太字タイトルとして出しっぱなしにする。
//
// メディア枠 (画像/動画) とテキスト (タイトル/説明/CTA) は別コンポーネントとして
// 分離しており、pin中の切り替えは「枠自体はそのまま、中身だけがクロスフェード」
// する形にしている (以前は枠ごとフェードイン/アウトしていた)。
// 初回登場時だけ、枠が画面下から大きくせり上がりながら拡大する
// ダイナミックな entrance を演出する。
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

            // ─── 初期状態: 枠は画面下 70% ぶんはみ出た縮小状態、中身は全部非表示 ───
            gsap.set(mediaFrame, { yPercent: 70, scale: 0.55, transformOrigin: '50% 100%' });
            gsap.set(textFrame, { opacity: 0, y: 16 });
            gsap.set(mediaStages, { opacity: 0 });
            gsap.set(textStages, { opacity: 0, y: 10 });
            gsap.set(dots, { height: 6, backgroundColor: 'rgba(255,255,255,0.4)' });
            textStages.forEach((el) => {
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

            // ─── entrance: 枠がせり上がりながら拡大 (往復させず、そのまま止まる) → テキスト → 1本目の中身 ───
            tl.to(mediaFrame, { yPercent: 0, scale: 1, duration: 0.22, ease: 'power3.out' }, 0);
            tl.to(textFrame, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.1);

            const firstMedia = mediaStages[0];
            const firstText = textStages[0];
            if (firstMedia) {
                tl.to(firstMedia, { opacity: 1, duration: 0.12, ease: 'power2.out' }, 0.12);
            }
            if (firstText) {
                tl.to(firstText, { opacity: 1, y: 0, duration: 0.1, ease: 'power3.out' }, 0.16);
            }

            // ─── pin中: 枠はそのまま、中身 (画像/動画 + テキスト) だけを順にクロスフェード ───
            // どのプロジェクトが「現在アクティブか」は tl.call() の片方向発火に頼らず、
            // 各プロジェクトの活性化しきい値 (activationTimes) と現在の再生位置を毎フレーム
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
                setActiveDot(PROJECTS[idx].id);
            };
            tl.eventCallback('onUpdate', applyActiveIndex);
            applyActiveIndex();
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

                            <div className="relative w-full max-w-5xl">
                                {/* メディア枠: 常設。中の画像/動画だけが切り替わる */}
                                <div
                                    data-media-frame
                                    className="relative w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-foreground/15 bg-foreground/[0.03]"
                                >
                                    {PROJECTS.map((p) => (
                                        <div
                                            key={p.id}
                                            data-media-stage
                                            data-media-id={p.id}
                                            className="absolute inset-0"
                                        >
                                            <MediaVisual
                                                media={
                                                    p.poster
                                                        ? { type: 'video', poster: p.poster, videoSrc: p.videoSrc }
                                                        : { type: 'placeholder' }
                                                }
                                            />
                                        </div>
                                    ))}

                                    {/* 現在地インジケーター: 何枚中の何枚目かをスライド風に示す */}
                                    <div
                                        aria-hidden
                                        className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2 md:gap-2.5"
                                    >
                                        {PROJECTS.map((p) => (
                                            <span
                                                key={p.id}
                                                data-media-dot
                                                data-media-id={p.id}
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
                                    {PROJECTS.map((p) => (
                                        <div
                                            key={p.id}
                                            data-text-stage
                                            data-media-id={p.id}
                                            className="absolute inset-x-0 top-0 flex flex-col items-start gap-2 md:gap-3"
                                        >
                                            <h3 className="font-sans font-black text-foreground text-[clamp(1.5rem,4vw,2.75rem)] leading-tight tracking-tight">
                                                {p.name}
                                            </h3>
                                            <p className="font-sans text-xs md:text-sm text-foreground/70 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-3">
                                                {p.description}
                                            </p>
                                            <a
                                                href={`/works/${p.slug}`}
                                                className="mt-1 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground border border-foreground/20 px-4 py-2 hover:border-accent hover:text-accent transition-colors"
                                            >
                                                <span>詳しくはこちら</span>
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
