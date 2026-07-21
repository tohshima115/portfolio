import React, { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { SystemGraph, type GraphLink, type GraphNode } from "@/components/common/SystemGraph";

/**
 * Works (WorksExplorer) のパネルボタンと同じ shared layoutId のモーフで、
 * 小さいカードのままだと窮屈なグラフを PC 幅ぶんまで拡大表示する。
 * 縮小時と拡大時、同じ layoutId を持つのは片方だけ (排他描画) にする。
 * 両方に同じ id を付けると、要素を取り合って両方消えてしまう。
 *
 * このコンポーネント自体は絶対配置 (inset-0) で、サイズ・sticky位置は
 * 呼び出し側 (BlogRelationGraph.astro) の枠divが担う。拡大時は
 * position: fixed で枠の外に飛び出すだけなので、枠のサイズは変わらず
 * 隣の記事一覧が詰め直されることもない。
 */

const SPRING = { type: "spring" as const, stiffness: 300, damping: 34, mass: 0.9 };

interface Props {
    nodes: GraphNode[];
    links: GraphLink[];
    /** 記事詳細ページ用。このノードを常時ハイライトする */
    activeNodeId?: string;
}

export const BlogRelationGraphPanel: React.FC<Props> = ({ nodes, links, activeNodeId }) => {
    const [expanded, setExpanded] = useState(false);
    const layoutId = `blog-relation-graph-${useId()}`;

    useEffect(() => {
        if (!expanded) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setExpanded(false);
        };
        window.addEventListener("keydown", onKeyDown);

        const { body } = document;
        const gutter = window.innerWidth - document.documentElement.clientWidth;
        const prevOverflow = body.style.overflow;
        const prevPadding = body.style.paddingRight;
        body.style.overflow = "hidden";
        if (gutter > 0) body.style.paddingRight = `${gutter}px`;

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            body.style.overflow = prevOverflow;
            body.style.paddingRight = prevPadding;
        };
    }, [expanded]);

    if (nodes.length === 0) return null;

    return (
        <>
            {!expanded && (
                <motion.div
                    layoutId={layoutId}
                    transition={SPRING}
                    style={{ borderRadius: 16 }}
                    className="absolute inset-0 overflow-hidden border border-foreground/15 bg-foreground/[0.02]"
                >
                    <SystemGraph nodes={nodes} links={links} chrome={false} activeNodeId={activeNodeId} />

                    {/* PC のみ: 縮小サイズはこれ以上大きくしない代わりに、押すと拡大表示できる */}
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        aria-label="関係グラフを拡大表示"
                        className="absolute right-2.5 top-2.5 hidden h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-foreground/12 bg-background/75 text-foreground/70 backdrop-blur-md transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground lg:flex"
                    >
                        <Maximize2 size={15} strokeWidth={1.75} aria-hidden />
                    </button>
                </motion.div>
            )}

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                        onClick={() => setExpanded(false)}
                    />
                )}
            </AnimatePresence>

            {expanded && (
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
                    <motion.div
                        layoutId={layoutId}
                        transition={SPRING}
                        style={{ borderRadius: 20 }}
                        className="pointer-events-auto relative flex h-[min(78vh,640px)] w-[min(92vw,960px)] flex-col overflow-hidden border border-foreground/12 bg-background shadow-[0_24px_70px_-30px_rgba(0,0,0,0.35)]"
                    >
                        <SystemGraph nodes={nodes} links={links} chrome={false} activeNodeId={activeNodeId} />
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            aria-label="閉じる"
                            className="absolute right-3 top-3 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-foreground/12 bg-background/80 text-muted-foreground backdrop-blur-md transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                        >
                            <X size={16} strokeWidth={1.75} aria-hidden />
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
};
