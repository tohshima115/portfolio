import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HoverBackgroundProps {
    hoveredItem: string | null;
}

export const HoverBackground: React.FC<HoverBackgroundProps> = ({ hoveredItem }) => {
    // 将来的にここを画像やvideo要素に置き換えることを想定したマッピング
    const backgrounds: Record<string, string> = {
        "ARCHIVES": "bg-blue-900/60",
        "LOGS": "bg-emerald-900/60",
        "PROFILE": "bg-purple-900/60",
        "COMM": "bg-rose-900/60",
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-overlay">
            {/* ベースの背景（暗めにして上に重なる色が映えるようにすることもできる） */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-background)_0%,var(--color-muted)_100%)] opacity-80" />

            <AnimatePresence>
                {hoveredItem && backgrounds[hoveredItem] && (
                    <motion.div
                        key={hoveredItem}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`absolute inset-0 ${backgrounds[hoveredItem]} flex items-center justify-center`}
                    >
                        {/* 将来的にここでコンポーネントやアニメーションを表示する */}
                        {/* <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/path/to/image.jpg')" }} /> */}
                        {/* <video autoPlay loop muted className="w-full h-full object-cover">...</video> */}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ノイズやスキャンラインなどの全体エフェクトを被せる場合はここに配置 */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }} />
        </div>
    );
};
