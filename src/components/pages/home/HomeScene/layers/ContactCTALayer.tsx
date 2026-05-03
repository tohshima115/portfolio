import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

export const ContactCTALayer = ({ progress }: Props) => {
    // セクション 5 (CTA) は progress 1.0 終端。
    const opacity = useTransform(progress, [0.86, 0.95, 1], [0, 1, 1]);
    const yOffset = useTransform(progress, [0.86, 1], [40, 0]);

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(92vw,860px)] pointer-events-auto"
        >
            <div className="border border-accent/40 bg-background/70 backdrop-blur-xl px-6 sm:px-12 py-10 sm:py-14 text-center">
                <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent mb-4">
                    + STATUS / 05
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1] mb-5">
                    2026.06 退職予定。
                    <br />
                    7 月以降の入社が可能です。
                </h2>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-xl mx-auto mb-10">
                    プロダクトエンジニア / コーポレートエンジニア の枠でお話しできる方、カジュアル面談を歓迎します。スカウトもお待ちしています。
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                    <a
                        href="/contact"
                        className="group inline-flex items-center gap-2 px-6 h-11 bg-foreground text-background font-mono text-[10px] tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Open Channel
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
                        href="/about"
                        className="inline-flex items-center gap-2 px-6 h-11 border border-foreground/30 font-mono text-[10px] tracking-[0.3em] uppercase hover:border-accent hover:text-accent transition-colors"
                    >
                        About / Profile
                    </a>
                </div>

                <div className="flex items-center justify-center gap-6 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                    <a
                        href="https://github.com/tohshima115"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        GitHub ↗
                    </a>
                    <span className="text-border">·</span>
                    <a
                        href="https://x.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        X (Twitter) ↗
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
