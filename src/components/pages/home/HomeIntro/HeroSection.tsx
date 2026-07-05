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

                <ScrollCue />
            </div>
        </section>
    );
};

// テキストの直下、画面中央よりやや下の位置に置くスクロール誘導。
// viewport 最下部 (グラデーションが明るくなる帯) に置くとコントラストが
// 落ちて見えづらいため、あえてビューポート端には固定しない。
const ScrollCue = () => {
    return (
        <div className="mt-14 sm:mt-20 flex flex-col items-center gap-2 text-white/60">
            <span className="font-mono text-3xs sm:text-2xs tracking-[0.3em] uppercase">
                Scroll
            </span>
            <motion.span
                aria-hidden
                className="block w-px h-6 bg-white/50"
                animate={{ y: [0, 8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
};
