import React from 'react';

interface HoverBackgroundProps {
    /** 互換のため残しているがホバー色オーバーレイは廃止済み */
    hoveredItem: string | null;
}

export const HoverBackground: React.FC<HoverBackgroundProps> = () => {
    return (
        // mix-blend-overlay はかつてホバー色オーバーレイをきれいに blend する
        // ためのものだったが、その演出は撤去済み。今は静的な radial gradient +
        // film noise を乗せているだけなので mix-blend を維持する意味がなく、
        // 別レイヤー強制 (= 余計な合成コスト) なので外す。代わりに gradient
        // の不透明度を下げてコンターが透ける割合をキープする。
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* ベース背景: 薄い放射グラデーション (mix-blend-overlay 撤去に伴い opacity を 80→30 へ) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-background)_0%,var(--color-muted)_100%)] opacity-30" />

            {/* 全体に薄いフィルムノイズを乗せる */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }} />
        </div>
    );
};
