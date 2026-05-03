import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

interface Case {
    title: string;
    type: string;
    tagline: string;
    href: string;
}

const cases: Case[] = [
    {
        title: 'AIChatClip',
        type: '0→1 Personal SaaS',
        tagline: '課金ユーザー獲得 / Chrome + Firefox 公開',
        href: '/projects/aichatclip',
    },
    {
        title: 'PL Dashboard',
        type: 'Internal Tool Replace',
        tagline: 'Excel → D1 + Zero Trust / 自発提案',
        href: '/projects/pl-dashboard',
    },
    {
        title: 'Expense Automation',
        type: 'Routine → Automation',
        tagline: '週 3h → 週 20 分 (年 130h 削減)',
        href: '/projects/expense-automation',
    },
    {
        title: 'Schedule Distributor',
        type: 'Team Support',
        tagline: '音声入力 × AI でカレンダー / LINE を自動化',
        href: '/projects/schedule-distributor',
    },
];

export const TrackRecordLayer = ({ progress }: Props) => {
    const opacity = useTransform(progress, [0.06, 0.18, 0.28, 0.36], [0, 1, 1, 0]);
    const yOffset = useTransform(progress, [0.06, 0.2, 0.36], [40, 0, -40]);

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(94vw,1000px)] pointer-events-auto"
        >
            <div className="border border-foreground/15 bg-background/70 backdrop-blur-xl px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">
                        + TRACK / 01
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                        Find → Solve → Use
                    </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1] mb-2">
                    課題発見 → 技術解決 → 実利用。
                    <br />
                    4 件で示すパターン。
                </h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
                    自分・チーム・業務、置かれた場所を変えても同じサイクルで動く。0→1 / 業務改善 / チーム支援が同じ人間の中にある。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cases.map((c) => (
                        <a
                            key={c.title}
                            href={c.href}
                            className="group relative border border-border bg-background/60 backdrop-blur-sm p-5 hover:border-accent/60 transition-colors flex items-start justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <div className="font-mono text-[10px] text-accent tracking-widest uppercase mb-2">
                                    {c.type}
                                </div>
                                <div className="text-base font-bold text-foreground tracking-tight mb-1.5 truncate">
                                    {c.title}
                                </div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                    {c.tagline}
                                </div>
                            </div>
                            <svg
                                className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0"
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
                    ))}
                </div>

                <div className="mt-7 flex items-center gap-4">
                    <a
                        href="/projects"
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-accent transition-colors"
                    >
                        All Projects →
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
