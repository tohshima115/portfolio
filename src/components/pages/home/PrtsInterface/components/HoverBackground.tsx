import React from 'react';

interface HoverBackgroundProps {
    /** 互換のため残しているがホバー色オーバーレイは廃止済み */
    hoveredItem: string | null;
}

export const HoverBackground: React.FC<HoverBackgroundProps> = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-overlay">
            {/* ベース背景: 薄い放射グラデーション。ホバー時のカラーオーバーレイは撤去。 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-background)_0%,var(--color-muted)_100%)] opacity-80" />

            {/* 全体に薄いフィルムノイズを乗せる */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }} />
        </div>
    );
};
