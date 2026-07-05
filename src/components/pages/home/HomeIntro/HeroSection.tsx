import { motion } from 'framer-motion';
import { HeroGradientBackground } from './HeroGradientBackground';

// ファーストビュー: 3D / マウス連動 / スクロール連動の演出は撤去し、
// 「グラデーション背景 + 中央テキスト + スクロール誘導」だけのシンプルな
// 1 画面構成にする。モバイルを基準にレイアウトし、md 以上で拡大する。
export const HeroSection = () => {
    return (
        <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden text-white">
            <HeroGradientBackground />

            <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                <h1 className="font-black tracking-tight leading-none text-5xl sm:text-6xl md:text-8xl">
                    TOYOSHIMA
                </h1>
                <p className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-white/70">
                    Designer / Engineer
                </p>
            </div>

            <ScrollCue />
        </section>
    );
};

// 画面下部固定のスクロール誘導。グラデーションが明るくなる帯の上なので、
// 白系ではなくダーク (foreground寄り) にしてコントラストを確保する。
// 光の筋が上から下へさーっと流れ、少し間を置いて繰り返す。
const ScrollCue = () => {
    const trackHeight = 56; // px
    const streakHeight = 20; // px
    const duration = 1.1;
    const repeatDelay = 1.3;

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-foreground/70">
            <span className="font-mono text-3xs sm:text-2xs tracking-[0.3em] uppercase">
                Scroll
            </span>
            <div
                aria-hidden
                className="relative w-px overflow-hidden bg-foreground/15"
                style={{ height: trackHeight }}
            >
                <motion.span
                    className="absolute inset-x-0 top-0 bg-gradient-to-b from-transparent via-foreground to-transparent"
                    style={{ height: streakHeight }}
                    initial={{ y: -streakHeight, opacity: 0 }}
                    animate={{
                        y: [-streakHeight, trackHeight],
                        opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration,
                        repeat: Infinity,
                        repeatDelay,
                        ease: 'easeIn',
                        times: [0, 0.15, 0.7, 1],
                    }}
                />
            </div>
        </div>
    );
};
