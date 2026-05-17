import { SvgLogoTitle } from './SvgLogoTitle';

/**
 * Hero 内のロゴ + タイトル領域。
 *
 * 旧構造は HTML DOM の grid + 各 cell の motion.div + text の motion.div で構成して
 * いたが、Hero の親が `transform-style: preserve-3d` + 3D rotation 状態のときに
 * 「子要素が頻繁に変化する DOM ツリー」は compositor で「3D 投影後の bitmap を毎
 * フレーム再生成」する必要があり、raster pipeline が追いつかず明滅・引き伸ばし・
 * 想定外の形が発生していた (等高線 canvas は 1 テクスチャなので問題なし)。
 *
 * SvgLogoTitle で 1 つの <svg> に統合することで replaced element = 1 テクスチャ
 * 扱いになり、親 3D 変換とのラスタ競合を完全に回避する。
 */
export const MainTitle = ({ skipIntro = false }: { skipIntro?: boolean }) => {
    return (
        <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
                transform: 'translate(-50%, -50%) translateZ(80px)',
                marginTop: '-40px', // 3Dパースによる視覚的なズレ補正
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Desktop SVG */}
            <div className="hidden md:block">
                <SvgLogoTitle skipIntro={skipIntro} layout="desktop" />
            </div>
            {/* Mobile SVG */}
            <div className="md:hidden">
                <SvgLogoTitle skipIntro={skipIntro} layout="mobile" />
            </div>
        </div>
    );
};
