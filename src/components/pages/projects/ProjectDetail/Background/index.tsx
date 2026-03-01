import React from 'react';
import { motion } from 'framer-motion';

/**
 * 幾何学的ブロックの集合体（1セット分）
 * これを2つ並べてループさせます。
 */
const GeometricPatternSet = () => (
    <div className="relative w-1/2 h-full flex-shrink-0">
        {/* --- 大きなベースブロック（白や極薄いグレー） --- */}
        <div className="absolute top-[10%] left-[5%] w-[30%] h-[40%] bg-white/40 shadow-[0_0_40px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute top-[40%] left-[40%] w-[25%] h-[50%] bg-white/30"></div>
        <div className="absolute top-[20%] left-[70%] w-[15%] h-[20%] bg-white/50"></div>

        {/* --- 枠線のみのブロック --- */}
        <div className="absolute top-[15%] left-[35%] w-[20%] h-[30%] border border-gray-300/40"></div>
        <div className="absolute top-[60%] left-[10%] w-[15%] h-[15%] border border-gray-300/60"></div>

        {/* --- デジタルノイズ・グリッチ風のライン --- */}
        <div className="absolute top-[30%] left-[60%] w-[120px] h-[1px] bg-gray-300"></div>
        <div className="absolute top-[31%] left-[62%] w-[80px] h-[2px] bg-gray-300/50"></div>
        <div className="absolute top-[75%] left-[45%] w-[200px] h-[1px] bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>

        {/* --- ドットマトリクス（点字ブロックのような模様） --- */}
        <div className="absolute top-[50%] left-[80%] w-[100px] h-[80px] opacity-20"
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
        </div>
        <div className="absolute top-[20%] left-[15%] w-[60px] h-[60px] opacity-10"
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
        </div>

        {/* --- クロス（十字）マーカー --- */}
        <div className="absolute top-[25%] left-[25%] w-4 h-4 opacity-30">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black"></div>
        </div>
        <div className="absolute top-[65%] left-[85%] w-6 h-6 opacity-20">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black"></div>
        </div>

        {/* --- 極小のアクセントブロック（黒・グレー） --- */}
        <div className="absolute top-[45%] left-[45%] w-2 h-2 bg-gray-400/40"></div>
        <div className="absolute top-[80%] left-[30%] w-3 h-1 bg-gray-400/50"></div>
    </div>
);

/**
 * 手前に配置する細かなパーツ群（早く動く）
 */
const ForegroundPatternSet = () => (
    <div className="relative w-1/2 h-full flex-shrink-0 pointer-events-none">
        {/* 視差効果を生むための、手前の浮遊パーツ */}
        <div className="absolute top-[18%] left-[28%] w-[40px] h-[4px] bg-gray-300/80"></div>
        <div className="absolute top-[58%] left-[75%] w-[2px] h-[20px] bg-gray-300/80"></div>
        <div className="absolute top-[85%] left-[15%] w-[8px] h-[8px] border border-gray-400"></div>

        {/* 薄い文字の残骸（FUIらしさ） */}
        <div className="absolute top-[40%] left-[8%] text-[8px] font-mono text-gray-400/30 tracking-widest rotate-90 origin-left">
            SYS.ARCHIVE_DATA //
        </div>
    </div>
);

/**
 * PRTS風 抽象幾何学背景コンポーネント (Framer Motion Refactor for Persistence)
 */
const Background: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-[#eef1f5] pointer-events-none">

            {/* LAYER 1: 背景レイヤー（ゆっくり動く大きなブロック群） */}
            <motion.div
                className="absolute inset-0 flex w-[200%]"
                initial={{ x: "0%" }}
                animate={{ x: "-50%" }}
                transition={{ duration: 150, ease: "linear", repeat: Infinity }}
                style={{ opacity: 0.6 }}
            >
                <GeometricPatternSet />
                <GeometricPatternSet />
            </motion.div>

            {/* LAYER 2: 前景レイヤー（少し早く動く小さなパーツ群） */}
            <motion.div
                className="absolute inset-0 flex w-[200%]"
                initial={{ x: "0%" }}
                animate={{ x: "-50%" }}
                transition={{ duration: 90, ease: "linear", repeat: Infinity }}
                style={{ opacity: 0.4 }}
            >
                <ForegroundPatternSet />
                <ForegroundPatternSet />
            </motion.div>

            {/* LAYER 3: 画面全体の質感調整（ビネット効果） */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.04)_100%)]"></div>
        </div>
    );
};

export default Background;
