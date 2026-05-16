import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
    progress: MotionValue<number>;
}

export const ContactCTALayer = ({ progress }: Props) => {
    // セクション 5 (CTA) は progress 1.0 終端。
    const opacity = useTransform(progress, [0.86, 0.95, 1], [0, 1, 1]);
    const yOffset = useTransform(progress, [0.86, 1], [40, 0]);

    // 透明度がほぼ 0 のときに card の上のリンク領域がクリック判定を奪わないよう、
    // pointerEvents 自体も opacity に連動させる (auto/none を motion value で切替)。
    const cardPointer = useTransform(opacity, (o) => (o > 0.4 ? 'auto' : 'none'));

    return (
        <motion.div
            style={{ opacity, y: yOffset, pointerEvents: cardPointer }}
            className="relative w-[min(92vw,860px)]"
        >
            {/*
              Card: 真っ白寄りの半透明パネル + 細い白枠。
              背後の \"空気遠近法パネル\" 側で全画面の backdrop-blur が
              すでにかかっているので、card 自身は backdrop-filter を持たず
              単なる translucent box にして合成コストを削る (= 体験上の
              見え方は変わらず、blur のレイヤー数を減らせる)。
            */}
            <div className="relative border border-white/60 bg-white/45 px-6 sm:px-12 py-10 sm:py-14 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.18)]">
                <div className="font-mono text-2xs tracking-[0.3em] uppercase text-accent mb-4">
                    + CONTACT / 04
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-5">
                    2026 年夏に今の仕事を辞めます。
                    <br />
                    <span className="text-foreground/60 text-2xl sm:text-4xl">その後のことは、探しながら決めています。</span>
                </h2>

                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-xl mx-auto mb-10">
                    連絡してみたいと思ったら、してみてください。
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                    <a
                        href="/contact"
                        className="group inline-flex items-center gap-2 px-6 h-11 bg-foreground text-background font-mono text-2xs tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
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
                        className="inline-flex items-center gap-2 px-6 h-11 border border-foreground/30 font-mono text-2xs tracking-[0.3em] uppercase hover:border-accent hover:text-accent transition-colors"
                    >
                        About / Profile
                    </a>
                </div>

                <div className="flex items-center justify-center gap-6 font-mono text-2xs tracking-[0.25em] uppercase text-muted-foreground">
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
