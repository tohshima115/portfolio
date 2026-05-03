import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

const PROD = [
    {
        name: 'Workers',
        sub: 'Edge runtime',
        usedIn: 'AIChatClip · PL Dashboard',
    },
    {
        name: 'D1',
        sub: 'SQLite at edge',
        usedIn: 'AIChatClip · PL Dashboard',
    },
    {
        name: 'R2',
        sub: 'Object storage',
        usedIn: 'AIChatClip',
    },
    {
        name: 'Durable Objects',
        sub: 'WebSocket realtime',
        usedIn: 'AIChatClip',
    },
    {
        name: 'Workers AI',
        sub: '@cf/baai/bge-m3',
        usedIn: 'AIChatClip',
    },
    {
        name: 'Zero Trust',
        sub: 'Access control',
        usedIn: 'PL Dashboard',
    },
];

const APP = [
    'TypeScript',
    'React',
    'React Router v7',
    'Hono',
    'Astro',
    'Tailwind',
    'WXT (Browser Ext)',
    'Obsidian Plugin API',
    'Better Auth',
    'Drizzle',
    'Remotion',
];

export const TechStackLayer = ({ progress }: Props) => {
    // セクション 3 (Stack) は progress 0.6 中心。
    const opacity = useTransform(progress, [0.46, 0.56, 0.66, 0.76], [0, 1, 1, 0]);
    const yOffset = useTransform(progress, [0.46, 0.6, 0.76], [40, 0, -40]);

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(92vw,1000px)] pointer-events-auto"
        >
            <div className="border border-foreground/15 bg-background/70 backdrop-blur-xl px-6 sm:px-10 py-8 sm:py-10">
                <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">
                        + STACK / 03
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                        Tech at a Glance
                    </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1] mb-2">
                    Cloudflare スタックで
                    <br />
                    本番投入した実践者。
                </h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
                    AIChatClip および業務改善案件で実プロダクション運用したスタック。
                </p>

                <div className="mb-8">
                    <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                        — Production Experience
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PROD.map((item) => (
                            <div
                                key={item.name}
                                className="border border-accent/40 bg-accent/5 px-4 py-3 hover:bg-accent/10 transition-colors"
                            >
                                <div className="font-mono text-[11px] tracking-[0.15em] text-foreground font-bold mb-1">
                                    {item.name}
                                </div>
                                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-2">
                                    {item.sub}
                                </div>
                                <div className="font-mono text-[9px] tracking-[0.05em] text-accent/80 leading-snug">
                                    Used in {item.usedIn}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                        — Application & Tooling
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {APP.map((t) => (
                            <span
                                key={t}
                                className="font-mono text-[10px] tracking-[0.1em] px-2.5 py-1.5 border border-border text-foreground/80"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
