// Hero (ファーストビュー) の背景。
// FourClock (別プロジェクト) の options 画面で使っている「下中央起点のドーム型
// radial-gradient + フィルムノイズ」の設計をそのまま踏襲し、配色だけサイトの
// ブランドカラー (--color-logo 系, 緑) に寄せて再構成したもの。
export const HeroGradientBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 160% 90% at 50% 100%, var(--color-hero-gradient-1) 0%, var(--color-hero-gradient-2) 32%, var(--color-hero-gradient-3) 58%, var(--color-hero-gradient-4) 82%, var(--color-hero-gradient-5) 100%)',
                }}
            />
            {/* フィルムノイズ (フラットな帯を潰す粒状感) */}
            <div
                className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
                style={{
                    backgroundImage:
                        'url(\'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)"/%3E%3C/svg%3E\')',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '160px 160px',
                }}
            />
        </div>
    );
};
