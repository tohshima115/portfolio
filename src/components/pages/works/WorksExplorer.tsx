import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { Crosshair, Layers, List, Network, X } from 'lucide-react';
import { SystemGraph, type GraphLink, type GraphNode } from '@/components/common/SystemGraph';

/**
 * Works 一覧のステージ。
 *
 * 見た目も駆動もトップページの WorksSection を踏襲する。ステージを sticky で画面に
 * 留め、その下に作品数ぶんのスクロール区間を敷いて、スクロール位置から現在の作品を
 * 決める (GSAP の pin ではなく position: sticky なので、パネルを開いている間だけ
 * 追従を止める、といった制御が素直に書ける)。
 *
 * 唯一の演出はビューを開く 4 つのボタン。押すとボタン自身がメディア枠いっぱいの
 * パネルに育つ (framer-motion の layoutId 共有レイアウト)。枠の中で開閉が完結するので、
 * 画面幅によらず同じ挙動になる。
 */

export interface WorkItem {
    slug: string;
    title: string;
    duration: string;
    /** summary.what。枠下に出す説明文 */
    what: string;
    /** ラベル解決済みの担当領域 ("UI Design" 等) */
    roles: string[];
    stack: string[];
    /** public/ 配下のロゴマーク URL */
    logo?: string;
    /** ヒーロー画像。無い場合はロゴマークのフィールドにフォールバック */
    thumbnail?: string;
    /** public/ 配下の動画パス。あればサムネイル枠でループ再生し、thumbnail は poster に使う */
    thumbnailVideo?: string;
}

type PanelKey = 'list' | 'all' | 'focus' | 'stack';

const PANELS: Record<PanelKey, { icon: React.ElementType; label: string; eyebrow: string }> = {
    list: { icon: List, label: '作品リスト', eyebrow: 'Index' },
    all: { icon: Network, label: '全体マップ', eyebrow: 'All_Works' },
    focus: { icon: Crosshair, label: 'この作品を中心に', eyebrow: 'Focus' },
    stack: { icon: Layers, label: '使った技術', eyebrow: 'Stack' },
};

const PANEL_ORDER: PanelKey[] = ['list', 'all', 'focus', 'stack'];

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 34, mass: 0.9 };

// パネルは横に広いキャンバスなので、既定値より少し広げる。ラベルの重なりは
// 反発 (charge) ではなく衝突半径で解く。charge を上げすぎるとノードが枠外に出る
const GRAPH_FORCES = { charge: -170, linkDistance: 80, collide: 36 };

/** 1 作品あたりに割り当てるスクロール量 */
const SCROLL_PER_WORK_VH = 85;

export const projectNodeId = (slug: string) => `projects-${slug}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface Props {
    works: WorkItem[];
    nodes: GraphNode[];
    links: GraphLink[];
}

export const WorksExplorer: React.FC<Props> = ({ works, nodes, links }) => {
    const sectionRef = useRef<HTMLElement>(null);

    const [activeIndex, setActiveIndex] = useState(0);
    const [panel, setPanel] = useState<PanelKey | null>(null);
    // グラフ内でタグをクリックしたときの一時ハイライト。パネルを閉じたら捨てる
    const [highlightId, setHighlightId] = useState<string | null>(null);

    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    const active = works[activeIndex];

    // ── スクロール位置 ⇔ 現在の作品 ──
    const indexFromScroll = useCallback(() => {
        const section = sectionRef.current;
        if (!section) return 0;
        const range = section.offsetHeight - window.innerHeight;
        if (range <= 0) return 0;
        const top = section.getBoundingClientRect().top + window.scrollY;
        const progress = clamp((window.scrollY - top) / range, 0, 0.9999);
        return Math.floor(progress * works.length);
    }, [works.length]);

    const scrollToIndex = useCallback(
        (index: number, behavior: ScrollBehavior) => {
            const section = sectionRef.current;
            if (!section) return;
            const range = section.offsetHeight - window.innerHeight;
            if (range <= 0) return;
            const top = section.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: top + range * ((index + 0.5) / works.length),
                behavior,
            });
        },
        [works.length],
    );

    // パネルを開いている間はスクロール追従を止める。ref で読むのは、
    // scroll ハンドラを張り直さずに最新値を見たいだけのため
    const panelRef = useRef(panel);
    panelRef.current = panel;
    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            if (panelRef.current) return;
            setActiveIndex(indexFromScroll());
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [indexFromScroll]);

    // パネルを開いている間は背後のページをスクロールさせない
    useEffect(() => {
        if (!panel) return;
        const { body } = document;
        const gutter = window.innerWidth - document.documentElement.clientWidth;
        const prevOverflow = body.style.overflow;
        const prevPadding = body.style.paddingRight;
        body.style.overflow = 'hidden';
        if (gutter > 0) body.style.paddingRight = `${gutter}px`;
        return () => {
            body.style.overflow = prevOverflow;
            body.style.paddingRight = prevPadding;
        };
    }, [panel]);

    const openPanel = (key: PanelKey) => {
        setPanel(key);
        setHighlightId(null);
    };

    /** 閉じたあと、スクロール位置とパネル内で選んだ作品を合わせ直す */
    const closePanel = () => {
        setPanel(null);
        setHighlightId(null);
        requestAnimationFrame(() => {
            const target = activeIndexRef.current;
            if (indexFromScroll() !== target) scrollToIndex(target, 'auto');
        });
    };

    /** ドットや作品リストから選ぶ。スクロール位置がそのまま現在地なので、そこへ運ぶ */
    const select = (index: number, options?: { close?: boolean }) => {
        setActiveIndex(index);
        setHighlightId(null);
        if (options?.close) {
            setPanel(null);
            requestAnimationFrame(() => scrollToIndex(index, 'auto'));
            return;
        }
        if (!panelRef.current) {
            scrollToIndex(index, prefersReducedMotion ? 'auto' : 'smooth');
        }
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && panelRef.current) closePanel();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

    // この作品を中心とした部分グラフ (半径2)。
    // 作品 → 使っている技術 → その技術を使っている他の作品、までを含める。
    // 「同じ技術でどの作品とつながっているか」が、focus ビューで見たい情報そのもの。
    const focusGraph = useMemo(() => {
        const centerId = projectNodeId(active.slug);
        const endpoints = (link: GraphLink) => {
            const source = typeof link.source === 'string' ? link.source : link.source.id;
            const target = typeof link.target === 'string' ? link.target : link.target.id;
            return [source, target] as const;
        };

        const tagIds = new Set<string>();
        for (const link of links) {
            const [source, target] = endpoints(link);
            if (source === centerId) tagIds.add(target);
            if (target === centerId) tagIds.add(source);
        }

        const allowed = new Set<string>([centerId, ...tagIds]);
        for (const link of links) {
            const [source, target] = endpoints(link);
            if (tagIds.has(target)) allowed.add(source);
            if (tagIds.has(source)) allowed.add(target);
        }

        return {
            nodes: nodes.filter((n) => allowed.has(n.id)),
            links: links.filter((l) => {
                const [source, target] = endpoints(l);
                return allowed.has(source) && allowed.has(target);
            }),
        };
    }, [active.slug, nodes, links]);

    // 技術 → その技術を使っている作品数。stack パネルのバッジに使う
    const stackUsage = useMemo(() => {
        const usage = new Map<string, number>();
        for (const work of works) {
            for (const tech of work.stack) {
                usage.set(tech, (usage.get(tech) ?? 0) + 1);
            }
        }
        return usage;
    }, [works]);

    const handleNodeClick = (node: GraphNode) => {
        if (node.type === 'projects') {
            const index = works.findIndex((w) => projectNodeId(w.slug) === node.id);
            if (index === -1) return;
            // 全体マップは「どれを見るか選ぶ」ビューなので、選んだら作品に戻る。
            // focus は「つながりをたどる」ビューなので、開いたまま中心を移す。
            select(index, { close: panel === 'all' });
            return;
        }
        setHighlightId((current) => (current === node.id ? null : node.id));
    };

    const graphActiveId = highlightId ?? projectNodeId(active.slug);

    return (
        <MotionConfig reducedMotion="user" transition={SPRING}>
            <section
                ref={sectionRef}
                className="relative"
                style={{ height: `${works.length * SCROLL_PER_WORK_VH}vh` }}
            >
                {/* 見出しは sticky の外に置かない。外に置くと、その高さぶんスクロール
                    するまでステージが画面に収まらない。ホームの WorksSection と同じく
                    見出しごと 100svh の中に入れて、到達した瞬間から絵が完成している状態にする */}
                <div className="sticky top-0 flex h-[100svh] flex-col justify-center gap-[2.5svh] pt-24 md:pt-28">
                    <header className="text-center">
                        <nav
                            aria-label="Breadcrumb"
                            className="mb-3 flex items-center justify-center gap-2 font-mono text-2xs uppercase tracking-[0.3em] text-muted-foreground"
                        >
                            <a href="/" className="transition-colors hover:text-accent">
                                Home
                            </a>
                            <span className="text-border">/</span>
                            <span className="text-foreground">Works</span>
                        </nav>
                        <h1 className="font-sans font-black uppercase leading-none tracking-tight text-foreground text-[clamp(2rem,6svh,3.5rem)]">
                            Works
                        </h1>
                    </header>

                    <div>
                        {/* ステージ = メディア枠と同じ高さの箱。パネルはこの箱を基準に開く */}
                        <div className="relative w-full">
                            <div className="relative w-full aspect-video overflow-hidden rounded-2xl md:rounded-3xl border border-foreground/15 bg-foreground/[0.02]">
                                {works.map((work, index) => {
                                    const isActive = index === activeIndex;
                                    return (
                                        <motion.a
                                            key={work.slug}
                                            href={`/works/${work.slug}`}
                                            className="absolute inset-0"
                                            initial={false}
                                            animate={{ opacity: isActive ? 1 : 0 }}
                                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                                            aria-hidden={!isActive}
                                            tabIndex={isActive ? 0 : -1}
                                        >
                                            <WorkVisual
                                                work={work}
                                                index={index}
                                                isActive={isActive}
                                            />
                                        </motion.a>
                                    );
                                })}

                                {/* 現在地インジケーター兼セレクター */}
                                <div className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2 md:left-4">
                                    <div className="flex flex-col items-center gap-1 rounded-full border border-foreground/10 bg-background/70 px-1 py-1.5 backdrop-blur-md">
                                        {works.map((work, index) => (
                                            <button
                                                key={work.slug}
                                                type="button"
                                                onClick={() => select(index)}
                                                aria-label={work.title}
                                                aria-current={index === activeIndex}
                                                className="group/dot relative flex h-7 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground md:h-6 md:w-5"
                                            >
                                                <motion.span
                                                    className={`block w-1.5 rounded-full ${
                                                        index === activeIndex
                                                            ? 'bg-foreground'
                                                            : 'bg-foreground/30 group-hover/dot:bg-foreground/60'
                                                    }`}
                                                    animate={{ height: index === activeIndex ? 18 : 6 }}
                                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                />
                                                <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-full border border-foreground/10 bg-background/90 px-2 py-1 font-mono text-3xs uppercase tracking-widest text-foreground opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover/dot:opacity-100 md:block">
                                                    {work.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── シグネチャ: このボタンがそのままパネルの外枠に育つ ── */}
                            {!panel && (
                                <div className="absolute right-2.5 top-2.5 z-20 grid grid-cols-2 gap-1.5 md:right-4 md:top-4 md:grid-cols-1 md:gap-2">
                                    {PANEL_ORDER.map((key) => (
                                        <PanelButton key={key} panelKey={key} onOpen={openPanel} morph />
                                    ))}
                                </div>
                            )}

                            {/* パネルはメディア枠の外に置く。狭い画面では枠より下まで伸ばして
                                グラフに高さを確保する (aspect-video のままだと潰れて読めない) */}
                            {panel && (
                                <motion.div
                                    key={panel}
                                    layoutId={`works-panel-${panel}`}
                                    style={{ borderRadius: 16 }}
                                    className="absolute left-0 right-0 top-0 z-30 flex h-[min(72vh,26rem)] flex-col overflow-hidden border border-foreground/12 bg-background shadow-[0_24px_70px_-30px_rgba(0,0,0,0.35)] md:inset-3 md:h-auto md:bg-background/95 md:backdrop-blur-xl"
                                >
                                    <PanelBody
                                        panel={panel}
                                        works={works}
                                        activeIndex={activeIndex}
                                        onSelect={select}
                                        onOpen={openPanel}
                                        onClose={closePanel}
                                        allNodes={nodes}
                                        allLinks={links}
                                        focusGraph={focusGraph}
                                        graphActiveId={graphActiveId}
                                        onNodeClick={handleNodeClick}
                                        stackUsage={stackUsage}
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* ── 枠下のテキスト。grid で重ねて、切り替え時に高さが跳ねないようにする ── */}
                        <div className="mt-4 grid md:mt-[3svh]">
                            {works.map((work, index) => {
                                const isActive = index === activeIndex;
                                return (
                                    <motion.div
                                        key={work.slug}
                                        className="col-start-1 row-start-1 flex flex-col items-start gap-2 md:gap-3"
                                        initial={false}
                                        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 8 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                                        aria-hidden={!isActive}
                                    >
                                        <h2 className="font-sans font-black text-foreground text-[clamp(1.5rem,3.2vw,2.75rem)] leading-tight tracking-tight">
                                            {work.title}
                                        </h2>
                                        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-muted-foreground">
                                            {work.duration}
                                            <span className="mx-2 text-border">/</span>
                                            {work.roles.join(' · ')}
                                        </p>
                                        <p className="font-sans text-xs md:text-sm text-foreground/70 leading-relaxed max-w-xl line-clamp-3">
                                            {work.what}
                                        </p>
                                        <a
                                            href={`/works/${work.slug}`}
                                            tabIndex={isActive ? 0 : -1}
                                            className="mt-1 inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 font-sans text-sm text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                                        >
                                            <span>詳しくはこちら</span>
                                            <span aria-hidden>→</span>
                                        </a>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </MotionConfig>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 閉じているときはボタンの列に、開いているときはパネルのヘッダー行に居る同じボタン。
 * layoutId (= パネルの外枠へ育つモーフ) を持つのは列のボタンだけ。ヘッダーのボタンにも
 * 同じ layoutId を付けると、パネルとその中のボタンが同一 id を取り合って両方消える。
 */
const PanelButton: React.FC<{
    panelKey: PanelKey;
    onOpen: (key: PanelKey) => void;
    morph?: boolean;
}> = ({ panelKey, onOpen, morph = false }) => {
    const { icon: Icon, label } = PANELS[panelKey];
    return (
        <motion.button
            layoutId={morph ? `works-panel-${panelKey}` : undefined}
            type="button"
            onClick={() => onOpen(panelKey)}
            aria-label={label}
            style={{ borderRadius: 12 }}
            className="group/btn relative grid h-10 w-10 shrink-0 place-items-center border border-foreground/12 bg-background/75 text-foreground/70 backdrop-blur-md transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            <span className="pointer-events-none absolute right-full top-1/2 mr-2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-foreground/10 bg-background/90 px-2.5 py-1 font-mono text-3xs uppercase tracking-widest text-foreground opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover/btn:opacity-100 md:block">
                {label}
            </span>
        </motion.button>
    );
};

const PanelBody: React.FC<{
    panel: PanelKey;
    works: WorkItem[];
    activeIndex: number;
    onSelect: (index: number, options?: { close?: boolean }) => void;
    onOpen: (key: PanelKey) => void;
    onClose: () => void;
    allNodes: GraphNode[];
    allLinks: GraphLink[];
    focusGraph: { nodes: GraphNode[]; links: GraphLink[] };
    graphActiveId: string;
    onNodeClick: (node: GraphNode) => void;
    stackUsage: Map<string, number>;
}> = ({
    panel,
    works,
    activeIndex,
    onSelect,
    onOpen,
    onClose,
    allNodes,
    allLinks,
    focusGraph,
    graphActiveId,
    onNodeClick,
    stackUsage,
}) => {
    const active = works[activeIndex];
    const { eyebrow } = PANELS[panel];

    const title = panel === 'focus' ? `${active.title} を中心に` : PANELS[panel].label;
    const hint = {
        list: '押すと、その作品に切り替わります',
        all: '作品のノードを押すと、その作品に切り替わります',
        focus: '同じ技術を使っている作品が、技術ノード越しにつながって見えます',
        stack: '数字は、この技術を使っている作品の数です',
    }[panel];

    const fadeIn = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: 0.12 },
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b border-foreground/10 px-3 py-2.5 md:px-4">
                <motion.div className="min-w-0" {...fadeIn}>
                    <p className="font-mono text-3xs uppercase tracking-[0.3em] text-muted-foreground">
                        {eyebrow}
                    </p>
                    <p className="truncate font-sans text-sm font-bold text-foreground">{title}</p>
                </motion.div>

                <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
                    {PANEL_ORDER.filter((key) => key !== panel).map((key) => (
                        <PanelButton key={key} panelKey={key} onOpen={onOpen} />
                    ))}
                    <motion.button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                        {...fadeIn}
                    >
                        <X size={16} strokeWidth={1.75} aria-hidden />
                    </motion.button>
                </div>
            </div>

            <motion.div className="relative min-h-0 flex-1" {...fadeIn}>
                {panel === 'list' && (
                    <ListView works={works} activeIndex={activeIndex} onSelect={onSelect} />
                )}
                {panel === 'stack' && <StackView active={active} stackUsage={stackUsage} />}
                {(panel === 'all' || panel === 'focus') && (
                    <SystemGraph
                        key={panel === 'focus' ? `focus-${active.slug}` : 'all'}
                        chrome={false}
                        nodes={panel === 'all' ? allNodes : focusGraph.nodes}
                        links={panel === 'all' ? allLinks : focusGraph.links}
                        activeNodeId={graphActiveId}
                        onNodeClick={onNodeClick}
                        forces={GRAPH_FORCES}
                    />
                )}
            </motion.div>

            <motion.p
                className="border-t border-foreground/10 px-3 py-2 font-mono text-3xs tracking-wider text-muted-foreground md:px-4"
                {...fadeIn}
            >
                {hint}
            </motion.p>
        </div>
    );
};

const ListView: React.FC<{
    works: WorkItem[];
    activeIndex: number;
    onSelect: (index: number, options?: { close?: boolean }) => void;
}> = ({ works, activeIndex, onSelect }) => (
    <ul className="mx-auto h-full max-w-xl overflow-y-auto p-2 md:p-3">
        {works.map((work, index) => {
            const isActive = index === activeIndex;
            return (
                <li key={work.slug}>
                    <button
                        type="button"
                        onClick={() => onSelect(index, { close: true })}
                        aria-current={isActive}
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                            isActive ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.03]'
                        }`}
                    >
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-foreground/10 bg-background">
                            {work.logo ? (
                                <img src={work.logo} alt="" aria-hidden className="h-full w-full object-cover" />
                            ) : (
                                <span className="font-sans text-sm font-black text-foreground/30">
                                    {work.title.charAt(0)}
                                </span>
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate font-sans text-sm font-bold text-foreground">
                                {work.title}
                            </span>
                            <span className="block truncate font-mono text-3xs uppercase tracking-wider text-muted-foreground">
                                {work.duration}
                            </span>
                        </span>
                        <span
                            aria-hidden
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`}
                        />
                    </button>
                </li>
            );
        })}
    </ul>
);

const StackView: React.FC<{ active: WorkItem; stackUsage: Map<string, number> }> = ({
    active,
    stackUsage,
}) => (
    <div className="h-full overflow-y-auto px-3 py-4 md:px-4">
        <p className="ui-micro-label mb-3">担当領域</p>
        <ul className="flex flex-wrap gap-1.5">
            {active.roles.map((role) => (
                <li
                    key={role}
                    className="inline-flex items-center rounded-full border border-foreground/12 px-2.5 py-1 font-mono text-2xs uppercase tracking-wider text-muted-foreground"
                >
                    {role}
                </li>
            ))}
        </ul>

        <p className="ui-micro-label mt-6 mb-3">技術スタック — {active.stack.length}</p>
        <ul className="flex flex-wrap gap-1.5">
            {active.stack.map((tech) => {
                const shared = stackUsage.get(tech) ?? 1;
                return (
                    <li
                        key={tech}
                        className="inline-flex items-center gap-1.5 rounded-full border border-foreground/12 bg-foreground/[0.03] px-2.5 py-1 font-mono text-2xs uppercase tracking-wider text-foreground"
                    >
                        {tech}
                        {shared > 1 && (
                            <span className="text-muted-foreground" aria-label={`${shared}件の作品で使用`}>
                                ×{shared}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    </div>
);

/**
 * ヒーロー画像があればそれを、無ければブランドのロゴマークを敷いたフィールドを出す。
 * "Preview" のプレースホルダーより、そのプロジェクトの顔が出ている方が一覧として速い。
 */
const WorkVisual: React.FC<{ work: WorkItem; index: number; isActive: boolean }> = ({
    work,
    index,
    isActive,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // autoPlay 任せにせず、アクティブになった動画だけを明示的に再生する。
    // ブラウザの自動再生ポリシーは muted プロパティが確実に立っていることを要求するため、
    // play() の直前に muted を再設定する。非アクティブは止めて負荷と帯域を抑える。
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        if (isActive) {
            void video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, [isActive]);

    if (work.thumbnailVideo) {
        return (
            <video
                ref={videoRef}
                src={work.thumbnailVideo}
                poster={work.thumbnail}
                aria-hidden
                loop
                muted
                playsInline
                preload={isActive ? 'auto' : 'none'}
                className="absolute inset-0 h-full w-full object-cover"
            />
        );
    }

    if (work.thumbnail) {
        return (
            <img
                src={work.thumbnail}
                alt=""
                aria-hidden
                loading={index === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 h-full w-full object-cover"
            />
        );
    }

    const tint = index % 2 === 0 ? 'var(--color-accent)' : 'var(--color-logo)';
    return (
        <div
            className="absolute inset-0 grid place-items-center"
            style={{
                background: `radial-gradient(110% 110% at 50% 10%, color-mix(in oklab, ${tint} 18%, var(--color-background)) 0%, var(--color-background) 55%, color-mix(in oklab, var(--color-foreground) 5%, var(--color-background)) 100%)`,
            }}
        >
            {work.logo ? (
                <img
                    src={work.logo}
                    alt=""
                    aria-hidden
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className="aspect-square w-[18%] min-w-16 max-w-32 rounded-[22%] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                />
            ) : (
                <span className="font-sans text-5xl font-black tracking-tight text-foreground/20">
                    {work.title.charAt(0)}
                </span>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

/** SSR では常に false。hydrate 後に確定する */
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const list = window.matchMedia(query);
        setMatches(list.matches);
        const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
        list.addEventListener('change', onChange);
        return () => list.removeEventListener('change', onChange);
    }, [query]);
    return matches;
}
