import { GrainOverlay } from '../visuals/GrainOverlay';
import { CONTACT, xUrl } from '@/consts';

// ページ末尾のフッター。
// Hero (ファーストビュー) の背景は「下中央起点のドーム型グラデーションで、上に
// 行くほど暗くなる (上=黒 / 下=背景色)」。フッターはそれを上下そのまま反転させ、
// 起点を上中央にした「上=背景色 / 下に行くほど暗くなる」グラデーションにする。
// こうすると Hero と同じ緑のアーチ (楕円) を保ったまま色の向きだけが逆になり、
// 上端は直上の Contact セクション (背景色) と継ぎ目なくつながり、下端は全幅で
// 黒へ沈む。暗い下半分に白文字でナビ / SNS / コピーライトを載せる。

// Hero の stop (bg 0 / g2 34 / g3 47 / g4 68 / g5 95 / g6 100) をそのまま使い、
// 起点だけ下中央 (50% 100%) → 上中央 (50% 0%) に移した＝Hero の上下反転。
const FOOTER_GRADIENT =
    'radial-gradient(ellipse 180% 90% at 50% 0%, ' +
    'var(--color-background) 0%, ' +
    'var(--color-hero-gradient-2) 34%, ' +
    'var(--color-hero-gradient-3) 47%, ' +
    'var(--color-hero-gradient-4) 68%, ' +
    'var(--color-hero-gradient-5) 95%, ' +
    'var(--color-hero-gradient-6) 100%)';

const NAV = [
    { href: '/', label: 'Home' },
    { href: '/works', label: 'Works' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
];

export const HomeFooter: React.FC = () => {
    const x = xUrl();
    const year = new Date().getFullYear();

    return (
        <footer className="relative w-full overflow-hidden bg-background text-white">
            {/* 反転グラデーション */}
            <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: FOOTER_GRADIENT }}
            />
            <GrainOverlay opacity={0.1} />
            {/*
              上端を直上セクションの背景色に確実に収束させて継ぎ目を消す。
              Hero が下端に敷いている linear-gradient overlay の上下反転版。
            */}
            <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[22vh]"
                style={{
                    background:
                        'linear-gradient(to bottom, var(--color-background) 0%, transparent 90%)',
                }}
            />

            <div className="relative z-10 px-6 md:px-12 pt-[17vh] md:pt-[22vh] pb-10">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
                        {/* Wordmark + one-liner */}
                        <div>
                            <p className="font-black tracking-tight leading-none text-4xl md:text-6xl">
                                TOYOSHIMA
                            </p>
                            <p className="mt-3 font-mono text-2xs md:text-xs tracking-[0.3em] uppercase text-white/60">
                                Designer / Engineer
                            </p>
                        </div>

                        {/* Nav + Social */}
                        <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
                            <nav aria-label="Footer">
                                <p className="font-mono text-2xs tracking-[0.3em] uppercase text-white/40 mb-4">
                                    Sitemap
                                </p>
                                <ul className="space-y-2.5">
                                    {NAV.map((item) => (
                                        <li key={item.href}>
                                            <a
                                                href={item.href}
                                                className="font-sans text-sm tracking-[0.08em] text-white/80 hover:text-white transition-colors"
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            <div>
                                <p className="font-mono text-2xs tracking-[0.3em] uppercase text-white/40 mb-4">
                                    Elsewhere
                                </p>
                                <ul className="space-y-2.5 font-mono text-xs tracking-[0.15em]">
                                    <li>
                                        <a
                                            href={CONTACT.github}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/80 hover:text-white transition-colors"
                                        >
                                            GITHUB ↗
                                        </a>
                                    </li>
                                    {x && (
                                        <li>
                                            <a
                                                href={x}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white/80 hover:text-white transition-colors"
                                            >
                                                X ↗
                                            </a>
                                        </li>
                                    )}
                                    <li>
                                        <a
                                            href={`mailto:${CONTACT.email}`}
                                            className="text-white/80 hover:text-white transition-colors"
                                        >
                                            EMAIL
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="font-mono text-2xs tracking-[0.2em] uppercase text-white/40">
                            © {year} Shogo Toyoshima
                        </p>
                        <p className="font-mono text-2xs tracking-[0.2em] uppercase text-white/30">
                            Built with Astro · Cloudflare
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
