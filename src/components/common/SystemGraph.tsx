import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import * as d3Zoom from 'd3-zoom';
import * as d3Selection from 'd3-selection';
import { motion } from 'framer-motion';

export type NodeType = 'works' | 'blog' | 'tag';

export interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    type: NodeType;
    url?: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
}

interface SystemGraphProps {
    nodes: GraphNode[];
    links: GraphLink[];
    activeNodeId?: string;
    className?: string;
}

export const SystemGraph: React.FC<SystemGraphProps> = ({
    nodes: initialNodes,
    links: initialLinks,
    activeNodeId: externalActiveNodeId,
    className = ""
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Maintain a local copy of nodes/links that D3 will mutate
    // and trigger renders when they update
    const [animatedNodes, setAnimatedNodes] = useState<GraphNode[]>([]);
    const [animatedLinks, setAnimatedLinks] = useState<GraphLink[]>([]);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

    // Zoom state
    const [transform, setTransform] = useState<d3Zoom.ZoomTransform>(d3Zoom.zoomIdentity);

    // Setup Zoom
    useEffect(() => {
        if (!containerRef.current) return;
        const zoom = d3Zoom.zoom<HTMLDivElement, unknown>()
            .scaleExtent([0.3, 4])
            .on("zoom", (event) => {
                setTransform(event.transform);
            });

        // Disable double-click zoom to avoid accidental zooming
        d3Selection.select(containerRef.current)
            .call(zoom)
            .on("dblclick.zoom", null);

    }, []);

    // Read URL ?tag= parameter for graph filtering
    const [filterTag, setFilterTag] = useState<string | null>(null);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setFilterTag(params.get('tag'));
    }, []);

    // Compute the active node ID (external prop takes priority, then filter tag)
    const activeNodeId = externalActiveNodeId || (filterTag ? `tag-${filterTag}` : undefined);

    // Filter nodes/links based on active tag filter
    const { filteredNodes, filteredLinks } = React.useMemo(() => {
        if (!filterTag) {
            return { filteredNodes: initialNodes, filteredLinks: initialLinks };
        }

        const tagNodeId = `tag-${filterTag}`;
        // Find all project IDs connected to this tag
        const connectedProjectIds = new Set<string>();
        for (const link of initialLinks) {
            const src = typeof link.source === 'string' ? link.source : link.source.id;
            const tgt = typeof link.target === 'string' ? link.target : link.target.id;
            if (tgt === tagNodeId) connectedProjectIds.add(src);
            if (src === tagNodeId) connectedProjectIds.add(tgt);
        }

        // Include: the tag node + all connected project nodes
        const allowedIds = new Set([tagNodeId, ...connectedProjectIds]);
        const fNodes = initialNodes.filter(n => allowedIds.has(n.id));
        const fLinks = initialLinks.filter(link => {
            const src = typeof link.source === 'string' ? link.source : link.source.id;
            const tgt = typeof link.target === 'string' ? link.target : link.target.id;
            return allowedIds.has(src) && allowedIds.has(tgt);
        });

        return { filteredNodes: fNodes, filteredLinks: fLinks };
    }, [initialNodes, initialLinks, filterTag]);

    // Initial resize observer
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(entries => {
            if (!entries[0]) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Setup Simulation when dimensions or data change
    useEffect(() => {
        if (!filteredNodes.length || dimensions.width === 0 || dimensions.height === 0) return;

        // Deep copy data to avoid mutating original
        const nodes = filteredNodes.map(d => ({ ...d }));
        const links = filteredLinks.map(d => ({ ...d }));

        setAnimatedNodes(nodes);
        setAnimatedLinks(links);

        // Clean up previous
        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        // Adjust force strengths based on node count for better layout
        const nodeCount = nodes.length;
        const chargeStrength = nodeCount <= 5 ? -200 : -150;
        const linkDistance = nodeCount <= 5 ? 100 : 80;

        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(chargeStrength))
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(linkDistance))
            .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .force("x", d3.forceX(dimensions.width / 2).strength(0.05))
            .force("y", d3.forceY(dimensions.height / 2).strength(0.05))
            .force("collide", d3.forceCollide().radius(25).iterations(2))
            .on("tick", () => {
                setAnimatedNodes([...nodes]);
                setAnimatedLinks([...links]);
            });

        simulationRef.current = simulation;

        return () => {
            simulation.stop();
        };
    }, [filteredNodes, filteredLinks, dimensions.width, dimensions.height]);

    // Graph UI configuration
    const getNodeStyle = (node: GraphNode) => {
        const isActive = node.id === activeNodeId;
        switch (node.type) {
            case 'works':
                return {
                    bg: isActive ? 'bg-accent' : 'bg-background',
                    border: 'border-accent',
                    size: isActive ? 16 : 10
                };
            case 'blog':
                return {
                    bg: isActive ? 'bg-emerald-400' : 'bg-background',
                    border: 'border-emerald-400',
                    size: isActive ? 16 : 10
                };
            case 'tag':
                return {
                    bg: isActive ? 'bg-muted-foreground' : 'bg-muted',
                    border: 'border-muted-foreground',
                    size: isActive ? 8 : 6
                };
            default:
                return { bg: 'bg-foreground', border: 'border-foreground', size: 8 };
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden bg-background/20 backdrop-blur-sm border border-border shadow-inner ${className}`}
        >
            {/* SVG Background for techy feel */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />

            {/* SVG implementation performs better for line drawing */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full" width={dimensions.width} height={dimensions.height}>
                <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                    {animatedLinks.map((link, i) => {
                        const src = link.source as GraphNode;
                        const tgt = link.target as GraphNode;
                        if (src.x === undefined || tgt.x === undefined || tgt.y === undefined) return null;
                        return (
                            <line
                                key={`link-${i}`}
                                x1={src.x}
                                y1={src.y}
                                x2={tgt.x}
                                y2={tgt.y}
                                stroke="var(--color-border)"
                                strokeWidth="1.5"
                                opacity={0.6}
                            />
                        );
                    })}
                </g>
            </svg>

            {/* DOM Overlay for interactive nodes */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                    transformOrigin: '0 0'
                }}
            >
                {animatedNodes.map(node => {
                    if (node.x === undefined || node.y === undefined) return null;
                    const style = getNodeStyle(node);
                    const isActive = node.id === activeNodeId;

                    // Hit area size (larger than visual node for easier clicking)
                    const hitSize = Math.max(style.size * 2.5, 24);

                    const handleClick = () => {
                        if (node.url) {
                            window.location.href = node.url;
                        }
                    };

                    const isClickable = !!node.url;

                    return (
                        <div key={node.id}>
                            {/* Clickable hit area - positioned exactly at node */}
                            <div
                                className={`absolute ${isClickable ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}`}
                                style={{
                                    width: hitSize,
                                    height: hitSize,
                                    left: node.x - hitSize / 2,
                                    top: node.y - hitSize / 2,
                                    zIndex: isActive ? 30 : 10,
                                }}
                                onClick={isClickable ? handleClick : undefined}
                            >
                                {/* Visual node element centered inside hit area */}
                                <motion.div
                                    className={`absolute rounded-full border shadow-sm transition-colors duration-300 ${style.bg} ${style.border}`}
                                    style={{
                                        width: style.size,
                                        height: style.size,
                                        left: (hitSize - style.size) / 2,
                                        top: (hitSize - style.size) / 2,
                                    }}
                                    whileHover={{ scale: 1.8 }}
                                    title={node.name}
                                />
                            </div>
                            {/* Labels */}
                            {(isActive || node.type === 'works' || node.type === 'tag' || node.type === 'blog') && (
                                <div
                                    className={`absolute pointer-events-none font-mono text-[9px] uppercase tracking-wider whitespace-nowrap mt-1 flex items-center justify-center ${isActive ? 'text-accent font-bold drop-shadow-md' : 'text-muted-foreground'}`}
                                    style={{
                                        left: node.x,
                                        top: node.y + (style.size / 2) + 2,
                                        // 完全に逆数だと見た目の大きさが常に一定になるため、0.6乗にしてズーム時に少し大きくなるように調整
                                        transform: `translateX(-50%) scale(${1 / Math.pow(Math.max(transform.k, 0.5), 0.6)})`,
                                        transformOrigin: 'top center',
                                        zIndex: isActive ? 20 : 0,
                                    }}
                                >
                                    {node.name}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
