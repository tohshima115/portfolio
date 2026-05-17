import type { CSSProperties } from 'react';
import { SvgLogoTitle } from './SvgLogoTitle';

/**
 * Hero 内のロゴ + タイトル領域。
 *
 * SvgLogoTitle を 2 枚レンダリングし Z 方向に分離する:
 *   1. グロー版 → translateZ(0) (床面)。filter:blur + 半透明で「ロゴが床に落とす影/光」
 *   2. 本体版  → translateZ(80px) (浮き上がり)
 * 両方とも同じ skipIntro で同期アニメーションするので、cell の reveal/drop down が
 * 進むのに合わせて床のグローも同時に育つ。
 *
 * SvgLogoTitle で 1 つの <svg> に統合しているため、グロー版の filter:blur は
 * SVG 1 テクスチャに対する GPU 1 パスで済む。
 */

// グロー版 (床面に落ちる影/光) の共通スタイル。
// 色は SVG 内部の var(--color-logo) をそのまま使う = ブランドカラー。
const GLOW_STYLE: CSSProperties = {
    filter: 'blur(28px)',
    opacity: 0.6,
    transform: 'translateZ(0)', // GPU レイヤ化
    willChange: 'filter',
    pointerEvents: 'none',
};

// 中央寄せ + 3D オフセット補正用の共通ラッパスタイル。
// translateZ だけ呼び出し側で差し替える。
const wrapperStyle = (z: number): CSSProperties => ({
    transform: `translate(-50%, -50%) translateZ(${z}px)`,
    marginTop: '-40px', // 3D パースによる視覚的なズレ補正
    transformStyle: 'preserve-3d',
});

export const MainTitle = ({ skipIntro = false }: { skipIntro?: boolean }) => {
    return (
        <>
            {/* 床面 (Z=0) のグロー: ロゴが床に落とす影/光 */}
            <div
                aria-hidden
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={wrapperStyle(0)}
            >
                <div className="hidden md:block" style={GLOW_STYLE}>
                    <SvgLogoTitle skipIntro={skipIntro} layout="desktop" />
                </div>
                <div className="md:hidden" style={GLOW_STYLE}>
                    <SvgLogoTitle skipIntro={skipIntro} layout="mobile" />
                </div>
            </div>

            {/* 浮き上がり (Z=80px) の本体ロゴ */}
            <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={wrapperStyle(80)}
            >
                <div className="hidden md:block">
                    <SvgLogoTitle skipIntro={skipIntro} layout="desktop" />
                </div>
                <div className="md:hidden">
                    <SvgLogoTitle skipIntro={skipIntro} layout="mobile" />
                </div>
            </div>
        </>
    );
};
