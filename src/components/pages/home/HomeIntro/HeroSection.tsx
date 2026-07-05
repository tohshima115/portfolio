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
const ScrollCue = () => {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-foreground/70">
            <span className="font-mono text-3xs sm:text-2xs tracking-[0.3em] uppercase">
                Scroll
            </span>
            <motion.span
                aria-hidden
                className="block w-px h-6 bg-foreground/60"
                animate={{ y: [0, 8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
};
