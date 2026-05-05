import { useRef } from 'react';
import { CornerLabel } from '../primitives/CornerLabel';
import { CountUp } from '../primitives/CountUp';
import { KeyValueGrid } from '../primitives/KeyValueGrid';
import { GridLayer } from '../visuals/GridLayer';
import { SectionFrame } from '../visuals/SectionFrame';
import { useScrollScene } from '../hooks/useScrollScene';
import { useReducedMotion } from '../hooks/useReducedMotion';

// 業務改善 3 本横スクロール: PL Dashboard / Expense Automation / Schedule Distributor。
// docs/career/projects/{pl-dashboard,expense-automation,schedule-distributor}.md より。
//
// gsap.matchMedia で desktop は GSAP 横スクロール pin、mobile (<768px) は縦スタックに退化。
// 各ペイン内 reveal は containerAnimation で個別に発火させる代わりに、
// シンプル化のため pin scrub と独立した IntersectionObserver で発火させる。

interface OpsItem {
    id: string;
    label: string;
    headline: string;
    bigNumber?: { value: number; unit: string; sub: string };
    duration: string;
    role: string;
    stack: string[];
    trigger: string;
    status: string;
}

const OPS: OpsItem[] = [
    {
        id: 'pl-dashboard',
        label: 'PL DASHBOARD',
        headline: '見にくい Excel を Cloudflare D1 に乗せ換えた。',
        bigNumber: { value: 2, unit: 'wk', sub: '/ design → ship' },
        duration: 'Approx. 2 weeks',
        role: '提案 / 設計 / 実装 / 運用',
        stack: ['Cloudflare D1', 'Workers', 'Zero Trust', 'Hono', 'React', 'OOUI'],
        trigger: '先輩の Excel 作業を眺めていて自発的に提案',
        status: '社内 / 月次運用中 / Google Workspace 限定公開',
    },
    {
        id: 'expense-automation',
        label: 'EXPENSE AUTOMATION',
        headline: '週 3 時間の手入力を、週 20 分に。',
        bigNumber: { value: 130, unit: 'h', sub: '/ year saved' },
        duration: 'Approx. 1 week',
        role: '課題発見 / 設計 / 実装',
        stack: ['TypeScript', 'LLM API', 'OCR', 'GAS', 'Spreadsheet'],
        trigger: 'ROI を電卓で叩いてから着手',
        status: '社内 / 半自動運用中 (人間チェック工程あり)',
    },
    {
        id: 'schedule-distributor',
        label: 'SCHEDULE DISTRIBUTOR',
        headline: '音声 1 本で Calendar と LINE を埋める。',
        bigNumber: { value: 3, unit: 'd', sub: '/ ship time' },
        duration: 'Approx. 3 days',
        role: '課題発見 / 設計 / 実装 / チーム導入',
        stack: ['TypeScript', 'Whisper', 'LLM API', 'Google Calendar', 'Electron'],
        trigger: '同僚 2 人の二重入力を肩代わりするため自発的に',
        status: '社内 / Windows Electron アプリとして配布',
    },
];

export const WorksOpsCarousel: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();

    useScrollScene(containerRef, {
        disabled: reduced,
        setup: ({ gsap }) => {
            const mm = gsap.matchMedia();

            mm.add('(min-width: 768px)', () => {
                const container = containerRef.current;
                if (!container) return;
                const track = container.querySelector<HTMLElement>(
                    '[data-ops-track]',
                );
                const pinTarget = container.querySelector<HTMLElement>(
                    '[data-ops-pin]',
                );
                if (!track || !pinTarget) return;

                const totalScroll = () => track.scrollWidth - window.innerWidth;
                const tween = gsap.to(track, {
                    x: () => -totalScroll(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: container,
                        start: 'top top',
                        end: () => `+=${totalScroll()}`,
                        pin: pinTarget,
                        scrub: 1.0,
                        invalidateOnRefresh: true,
                    },
                });

                // 各ペイン内の reveal を containerAnimation で発火
                container.querySelectorAll('[data-ops-pane]').forEach((pane) => {
                    const reveals = pane.querySelectorAll('[data-reveal]');
                    if (reveals.length === 0) return;
                    gsap.fromTo(
                        reveals,
                        { opacity: 0, y: 30 },
                        {
                            opacity: 1,
                            y: 0,
                            stagger: 0.06,
                            duration: 0.6,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: pane,
                                containerAnimation: tween,
                                start: 'left center',
                                toggleActions: 'play none none reverse',
                            },
                        },
                    );
                });

                return () => {
                    tween.scrollTrigger?.kill();
                    tween.kill();
                };
            });

            // mobile: GSAP scene を組まない (CSS の縦スタックがそのまま見える)
        },
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            data-section="works-ops"
            // desktop pin 中の総スクロール量 = ペイン数 * 100vw を確保するため、
            // セクション高さは概ね (ペイン数 + 1) * 100vh 相当。 reduced/mobile では各 100vh。
            style={{ minHeight: reduced ? `${OPS.length * 100}vh` : `${OPS.length * 100 + 60}vh` }}
        >
            {/* desktop: 横スクロール pin */}
            <div
                data-ops-pin
                className="hidden md:block relative w-full h-screen overflow-hidden bg-background"
            >
                <GridLayer size={48} opacity={0.04} />
                <SectionFrame inset={32} />

                <div className="absolute top-6 left-6 md:top-8 md:left-12 z-10">
                    <CornerLabel
                        label="OPS IMPROVEMENT"
                        id="02 — 04"
                        suffix="3 BUILDS"
                    />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    <span className="text-accent">←</span>
                    <span>scroll</span>
                    <span className="text-accent">→</span>
                </div>

                <div
                    data-ops-track
                    className="absolute top-0 left-0 h-full flex"
                    style={{ willChange: 'transform' }}
                >
                    {/* intro pane */}
                    <OpsIntroPane />
                    {OPS.map((it) => (
                        <OpsPane key={it.id} item={it} />
                    ))}
                </div>
            </div>

            {/* mobile: 縦スタック */}
            <div className="md:hidden relative w-full bg-background">
                <div className="px-6 pt-12 pb-6">
                    <CornerLabel
                        label="OPS IMPROVEMENT"
                        id="02 — 04"
                        suffix="3 BUILDS"
                    />
                </div>
                <OpsIntroPaneMobile />
                {OPS.map((it) => (
                    <OpsPaneMobile key={it.id} item={it} />
                ))}
            </div>
        </section>
    );
};

const OpsIntroPane: React.FC = () => (
    <div
        data-ops-pane
        className="flex-shrink-0 w-screen h-screen flex items-center px-12 lg:px-24"
    >
        <div className="max-w-2xl">
            <p
                data-reveal
                className="font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-4"
            >
                3 つの業務改善を一気に
            </p>
            <h3
                data-reveal
                className="font-sans font-bold text-foreground text-[clamp(2rem,4.5vw,3.5rem)] leading-tight tracking-tight"
            >
                受託・社内・チーム<br />
                どこに置いても、<br />
                <span className="text-foreground/60">課題 → 技術 → 実利用。</span>
            </h3>
            <p
                data-reveal
                className="mt-8 text-foreground/70 leading-relaxed max-w-md"
            >
                AIChatClip と並行して、デザイン事務所で実装してきた 3 つの業務改善。
                数字で語れるもの・語れないものを分けず、置いた場所で価値が出ているかを
                判定軸にしています。
            </p>
        </div>
    </div>
);

const OpsIntroPaneMobile: React.FC = () => (
    <div className="px-6 pb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-4">
            3 つの業務改善を一気に
        </p>
        <h3 className="font-sans font-bold text-foreground text-3xl leading-tight tracking-tight">
            受託・社内・チーム<br />
            <span className="text-foreground/60">どこに置いても、課題 → 技術 → 実利用。</span>
        </h3>
    </div>
);

const OpsPane: React.FC<{ item: OpsItem }> = ({ item }) => (
    <div
        data-ops-pane
        data-ops-id={item.id}
        className="relative flex-shrink-0 w-screen h-screen flex items-center px-12 lg:px-24"
    >
        {/* 区切り (左端の縦罫) */}
        <span
            aria-hidden
            className="absolute left-0 top-[20%] bottom-[20%] w-px bg-foreground/10"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 w-full max-w-6xl">
            {/* 左: 巨大数字 + 見出し */}
            <div>
                <span
                    data-reveal
                    className="block font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-4"
                >
                    + {item.label}
                </span>
                {item.bigNumber && (
                    <div data-reveal className="mb-8">
                        <span className="font-sans font-bold text-foreground text-[clamp(4rem,10vw,8rem)] leading-none tabular-nums">
                            <CountUp to={item.bigNumber.value} duration={900} />
                            <span className="ml-2 text-foreground/40 text-[0.4em]">
                                {item.bigNumber.unit}
                            </span>
                        </span>
                        <span className="block mt-2 font-mono text-[11px] tracking-[0.15em] text-muted-foreground/80">
                            {item.bigNumber.sub}
                        </span>
                    </div>
                )}
                <h4
                    data-reveal
                    className="font-sans font-bold text-foreground text-[clamp(1.4rem,2.5vw,2rem)] leading-snug tracking-tight"
                >
                    {item.headline}
                </h4>
            </div>

            {/* 右: KeyValueGrid */}
            <div data-reveal className="lg:pt-12">
                <KeyValueGrid
                    items={[
                        { key: 'Role', value: item.role },
                        {
                            key: 'Stack',
                            value: (
                                <span className="flex flex-wrap gap-x-2 gap-y-1">
                                    {item.stack.map((s, i) => (
                                        <span key={s}>
                                            {s}
                                            {i < item.stack.length - 1 && (
                                                <span className="text-muted-foreground/40 ml-1.5">/</span>
                                            )}
                                        </span>
                                    ))}
                                </span>
                            ),
                        },
                        { key: 'Duration', value: item.duration },
                        { key: 'Trigger', value: item.trigger },
                        { key: 'Status', value: item.status },
                    ]}
                />
            </div>
        </div>
    </div>
);

const OpsPaneMobile: React.FC<{ item: OpsItem }> = ({ item }) => (
    <article className="relative px-6 py-12 border-t border-foreground/10">
        <span className="block font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">
            + {item.label}
        </span>
        {item.bigNumber && (
            <div className="mb-6">
                <span className="font-sans font-bold text-foreground text-5xl leading-none tabular-nums">
                    {item.bigNumber.value}
                    <span className="ml-2 text-foreground/40 text-base">
                        {item.bigNumber.unit}
                    </span>
                </span>
                <span className="block mt-1 font-mono text-[11px] text-muted-foreground/80">
                    {item.bigNumber.sub}
                </span>
            </div>
        )}
        <h4 className="font-sans font-bold text-foreground text-xl leading-snug mb-6">
            {item.headline}
        </h4>
        <KeyValueGrid
            items={[
                { key: 'Role', value: item.role },
                { key: 'Stack', value: item.stack.join(' / ') },
                { key: 'Duration', value: item.duration },
                { key: 'Trigger', value: item.trigger },
                { key: 'Status', value: item.status },
            ]}
        />
    </article>
);
