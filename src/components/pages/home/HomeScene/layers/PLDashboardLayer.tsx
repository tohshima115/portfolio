import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

const tldr = [
    { k: 'Role', v: '課題発見 / 提案 / 設計 / 実装 / 社内デプロイ' },
    { k: 'Stack', v: 'Cloudflare Workers · D1 · Zero Trust · Hono · React · Tailwind' },
    { k: 'Trigger', v: '先輩の Excel を観察 →「ダッシュボードにした方が早い」と自発提案' },
    { k: 'Status', v: '社内で運用中（クライアント情報を含むためダミーデータでデモ可能）' },
];

export const PLDashboardLayer = ({ progress }: Props) => {
    // セクション 2 (PL Dashboard) は progress 0.4 中心。
    const opacity = useTransform(progress, [0.26, 0.36, 0.46, 0.56], [0, 1, 1, 0]);
    const yOffset = useTransform(progress, [0.26, 0.4, 0.56], [40, 0, -40]);

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(92vw,920px)] pointer-events-auto"
        >
            <div className="border border-foreground/15 bg-background/70 backdrop-blur-xl px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">
                        + INTERNAL TOOL / 02
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                        2025.11 / 約 2 週間
                    </span>
                </div>

                <div className="flex items-center gap-4 mb-5">
                    <div
                        aria-hidden
                        className="w-12 h-12 rounded-lg border border-accent/40 bg-accent/5 flex items-center justify-center font-mono text-[10px] tracking-[0.15em] text-accent"
                    >
                        PL
                    </div>
                    <div className="font-black tracking-tight text-2xl sm:text-3xl">
                        PL Dashboard
                    </div>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1.05] mb-4">
                    Excel → Cloudflare D1。
                    <br />
                    自発的に置き換えた社内ツール。
                </h2>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl mb-6">
                    先輩が毎月触っていた「成長した Excel」を OOUI ダッシュボードへ。Cloudflare D1 + Zero Trust で Google Workspace アドレスのみアクセス可能に。経営学部で身につけた PL 構造の理解がデータモデル設計で効いた。
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-6 gap-y-3 text-sm mb-8">
                    {tldr.map((row) => (
                        <div key={row.k} className="contents">
                            <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground pt-1">
                                {row.k}
                            </dt>
                            <dd className="text-foreground/85 leading-relaxed">
                                {row.v}
                            </dd>
                        </div>
                    ))}
                </dl>

                <div className="flex items-center gap-4">
                    <a
                        href="/projects/pl-dashboard"
                        className="group inline-flex items-center gap-2 px-5 h-10 bg-foreground text-background font-mono text-[10px] tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Open Case Study
                        <svg
                            className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </a>
                    <a
                        href="/projects"
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                        All Projects →
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
