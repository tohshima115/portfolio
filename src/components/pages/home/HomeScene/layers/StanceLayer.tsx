import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

interface Axis {
    code: string;
    title: string;
    body: string;
}

const axes: Axis[] = [
    {
        code: '01',
        title: 'Cloudflare を使い倒す',
        body: 'Workers / D1 / Durable Objects / Workers AI / Zero Trust を主戦場に。1 人運用・低レイテンシ・移植性を取りに行く判断。',
    },
    {
        code: '02',
        title: '新しいものはまず触る',
        body: '引き出しを広げる目的で AI 時代のサイクルに乗る。ただし「触ること」と「実プロダクトに採用する」は別軸。',
    },
    {
        code: '03',
        title: '流行ってるからは入れない',
        body: 'OpenClaw を権限の広さ / サプライチェーン汚染 / 代替手段の存在で採用見送り。流行と採用は分けて判断する。',
    },
];

export const StanceLayer = ({ progress }: Props) => {
    const opacity = useTransform(progress, [0.66, 0.76, 0.86, 0.93], [0, 1, 1, 0]);
    const yOffset = useTransform(progress, [0.66, 0.8, 0.93], [40, 0, -40]);

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(94vw,1000px)] pointer-events-auto"
        >
            <div className="border border-foreground/15 bg-background/70 backdrop-blur-xl px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">
                        + STANCE / 04
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                        Tech Selection
                    </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1] mb-2">
                    判断軸を持って
                    <br />
                    技術を選ぶ。
                </h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
                    深い専門領域を突き詰めるより、レンジを広げて判断軸で選び取る。これが Cloudflare 偏愛と新しい技術の触り方の根っこにある。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {axes.map((a) => (
                        <div
                            key={a.code}
                            className="border border-border bg-background/60 backdrop-blur-sm p-5"
                        >
                            <div className="font-mono text-[10px] text-accent tracking-widest uppercase mb-3">
                                + {a.code}
                            </div>
                            <h3 className="text-base font-bold text-foreground tracking-tight mb-2">
                                {a.title}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {a.body}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-7 flex items-center gap-4">
                    <a
                        href="/about"
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-accent transition-colors"
                    >
                        Read full →
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
