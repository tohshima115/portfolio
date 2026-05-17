import type { CSSProperties } from 'react';
import { SvgLogoTitle } from './SvgLogoTitle';

/**
 * Hero 内のロゴ + タイトル領域。
 *
 * SvgLogoTitle を 2 枚重ねる:
 *   1. グロー版 (背後): filter:blur + --color-logo を accent 色に上書き
 *   2. 本体版 (前面): 通常表示
 * 両方とも同じ skipIntro でアニメするので cell の reveal や drop down と
 * グローが同期して光る (静的な div グローだと「アニメ中まだ描かれてない部分」
 * までグローしてしまう問題を回避)。
 *
 * 旧構造は HTML DOM の grid + 各 cell の motion.div で組まれていたが、
 * Hero の親が preserve-3d + 3D rotation 状態のときに頻繁に変化する DOM ツリーは
 * compositor が毎フレームラスタライズし直して明滅していた。
 * SvgLogoTitle で 1 つの <svg> に統合することで replaced element = 1 テクスチャ
 * 扱いになり、グロー版の filter:blur も SVG 1 テクスチャに対する GPU 1 パスで済む。
 */

// グロー版コンテナの共通スタイル。
// --color-logo を accent に上書きすることで SVG 内の `var(--color-logo)` が
// すべて accent 色に置き換わる (= 色付きのにじんだロゴ)。
const GLOW_STYLE: CSSProperties = {
    // CSS カスタムプロパティを TS の CSSProperties に通すための any キャスト相当。
    ['--color-logo' as never]: 'var(--color-accent)',
    filter: 'blur(28px)',
    opacity: 0.55,
    transform: 'translateZ(0)', // GPU レイヤ化
    willChange: 'filter',
    // 本体版とピクセル一致で重ねるため inset:0。
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
};

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
            {/* Desktop */}
            <div className="relative hidden md:block">
                <div aria-hidden style={GLOW_STYLE}>
                    <SvgLogoTitle skipIntro={skipIntro} layout="desktop" />
                </div>
                <div className="relative">
                    <SvgLogoTitle skipIntro={skipIntro} layout="desktop" />
                </div>
            </div>
            {/* Mobile */}
            <div className="relative md:hidden">
                <div aria-hidden style={GLOW_STYLE}>
                    <SvgLogoTitle skipIntro={skipIntro} layout="mobile" />
                </div>
                <div className="relative">
                    <SvgLogoTitle skipIntro={skipIntro} layout="mobile" />
                </div>
            </div>
        </div>
    );
};
