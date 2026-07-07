import { useRef, useEffect, useState } from 'react';
import { SplitChars } from '../primitives/SplitChars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollScene } from '../hooks/useScrollScene';
import { GlobeBackground } from '../visuals/GlobeBackground';

// StackHeroSection = 独立した pin セクション。
// globe/見出しの pre-roll スクラブ (pin前、自然なスクロールで完結) →
// pin発生 → Design/Engineering タグの reveal → pin解除 → 通常スクロールで WorksSection へ。
// 以前は WorksSection の巨大な1本pin (935vh) の Phase A だったが、
// 「各チャプターごとに独立したpinを持つ」構成に分離した。

const STACK_PIN_SCROLL_VH = 150;
const STACK_PIN_HEIGHT_VH = 100;
const STACK_SECTION_MIN_HEIGHT_VH = STACK_PIN_SCROLL_VH + STACK_PIN_HEIGHT_VH;

const DESIGN_STACK = ['Figma', 'Illustrator', 'Photoshop', 'DTP'];
const ENGINEERING_STACK = [
    'TypeScript', 'React', 'Astro.js', 'Tailwind CSS', 'Hono', 'Cloudflare Workers', 'D1', 'KV', 'Git', 'Claude Code',
];

export const StackHeroSection: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    useScrollScene(containerRef, {
        disabled: reduced,
        deps: [isMobile],
        setup: ({ gsap, container }) => {
            const pinTarget = container.querySelector<HTMLElement>('[data-pin-inner]');
            if (!pinTarget) return;

            const mobile = window.innerWidth < 768;

            const globe = container.querySelector<HTMLElement>('[data-lead-globe]');
            const heroRow = container.querySelector<HTMLElement>('[data-hero-row]');
            const headlineChars = container.querySelectorAll(
                '[data-lead-heading] [data-split-chars][data-anim] > span',
            );
            const statBadges = container.querySelectorAll('[data-lead-statbadge]');
            const stats = container.querySelectorAll('[data-lead-stat]');

            if (statBadges.length > 0) gsap.set(statBadges, { y: 8 });
            if (stats.length > 0) gsap.set(stats, { y: 6 });

            // ─── Phase pre: globe スライド + headline roll-up (pin前、自然なスクロール中に完結) ───
            if (globe && heroRow) {
                const rowRect = heroRow.getBoundingClientRect();
                const globeRect = globe.getBoundingClientRect();
                const rowCenterX = rowRect.left + rowRect.width / 2;
                const globeCenterX = globeRect.left + globeRect.width / 2;
                const initialGlobeX = mobile ? 0 : rowCenterX - globeCenterX;

                gsap.set(globe, { x: initialGlobeX });
                gsap.set(headlineChars, { yPercent: -110, y: 0, opacity: 0 });

                const preTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        start: 'top bottom',
                        end: 'top top',
                        scrub: 0.4,
                    },
                });
                if (!mobile) {
                    preTl.to(globe, { x: 0, duration: 1.3, ease: 'power2.out' }, 0.9);
                }
                preTl.to(
                    headlineChars,
                    {
                        opacity: 1,
                        yPercent: 0,
                        y: 0,
                        stagger: 0.035,
                        duration: 0.12,
                        ease: 'power3.out',
                    },
                    1.6,
                );
            }

            // ─── pin: Design/Engineering タグ reveal だけの短い pin ───
            const progressFill = container.querySelector<HTMLElement>('[data-pin-progress-fill]');
            if (progressFill) gsap.set(progressFill, { scaleX: 0 });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top top',
                    end: `+=${STACK_PIN_SCROLL_VH}%`,
                    pin: pinTarget,
                    pinSpacing: true,
                    scrub: 0.6,
                    invalidateOnRefresh: true,
                    // pin中はスクロールしても画面自体は動かないため、
                    // 「あとどれくらいでpinが解けるか」を可視化するバーを進捗連動させる。
                    onUpdate: (self) => {
                        if (progressFill) gsap.set(progressFill, { scaleX: self.progress });
                    },
                },
            });

            tl.to(
                statBadges,
                { opacity: 1, y: 0, stagger: 0.15, duration: 0.15, ease: 'power2.out' },
                0.2,
            );
            tl.to(
                stats,
                { opacity: 1, y: 0, stagger: 0.02, duration: 0.15, ease: 'power2.out' },
                0.35,
            );
            // reveal完了後、少しhold してから pin 解除 (すぐ次に切り替わると慌ただしいため)
            tl.to({}, { duration: 0.3 }, 1.0);
        },
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: reduced ? '100svh' : `${STACK_SECTION_MIN_HEIGHT_VH}vh` }}
        >
            <div
                data-pin-inner
                className="relative w-full h-[100svh] overflow-hidden bg-background isolate"
            >
                <HeroLayer />
                {!reduced && <PinProgressBar />}
            </div>
        </section>
    );
};

// pin中はスクロールしても画面が動かないため、
// 「どれくらいスクロールが進んでpinが解除されるか」を示す進捗バー。
// bottom fixed の細い line + fill を scroll progress に応じて scaleX させるだけの軽量な指標。
const PinProgressBar: React.FC = () => (
    <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-40 h-[2px] bg-foreground/10"
    >
        <div
            data-pin-progress-fill
            className="h-full w-full origin-left bg-accent"
            style={{ transform: 'scaleX(0)' }}
        />
    </div>
);

// Cloudflare hero (z-10)
const HeroLayer: React.FC = () => (
    <div data-hero-layer className="absolute inset-0 z-10 flex items-center">
        <div className="relative w-full flex flex-col items-center gap-[3svh] md:gap-14">
            {/* スクロールでこのセクションに近づいた時点で「次は何のセクションか」が
                分かるよう、画面中央に大きく置く先出しタイトル。
                モバイルは svh 基準で縮めて、iPhone SE 級の低height機でも
                STACK/globe/tags が h-[100svh] 内に収まるようにする。 */}
            <div data-lead-stacktitle className="text-center px-6">
                <span className="block font-sans font-black uppercase tracking-tight text-foreground/90 text-[clamp(1.75rem,9svh,3.5rem)] md:text-[clamp(2.5rem,7vw,5.5rem)] leading-none">
                    Stack
                </span>
            </div>

            <div
                data-hero-row
                className="relative w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-[1svh] md:gap-16"
            >
                <div className="order-2 md:order-1">
                    <h2
                        data-lead-heading
                        className="font-sans font-bold text-foreground text-[clamp(1.15rem,4.5svh,2.5rem)] md:text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-tight max-w-xl"
                    >
                        <SplitChars text="Cloudflare が好きで、" className="block overflow-hidden" dataAnim />
                        <SplitChars
                            text="TypeScript を主に使っています。"
                            className="block overflow-hidden text-foreground/70"
                            dataAnim
                        />
                    </h2>

                    {/* Design / Engineering スタック — pin中に staggered reveal。
                        Hero の "Designer / Engineer" と表記順を揃え、Design を上に置く。 */}
                    <StackGroup label="Design" items={DESIGN_STACK} className="mt-[1.5svh] md:mt-5" />
                    <StackGroup label="Engineering" items={ENGINEERING_STACK} className="mt-[1svh] md:mt-4" />
                </div>

                <div
                    data-lead-globe
                    className="order-1 md:order-2 flex items-center justify-center -mb-[5svh] md:mb-0"
                >
                    <GlobeBackground className="w-full max-w-[min(360px,34svh)] sm:max-w-[min(400px,36svh)] md:max-w-[480px] aspect-square" />
                </div>
            </div>
        </div>
    </div>
);

const StackGroup: React.FC<{ label: string; items: string[]; className?: string }> = ({
    label,
    items,
    className,
}) => (
    <div className={className}>
        <div
            data-lead-statbadge
            style={{ opacity: 0 }}
            className="flex items-center gap-2 font-mono"
        >
            <span className="text-accent text-sm">+</span>
            <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{label}</span>
            <span aria-hidden className="h-px bg-foreground/15 w-12" />
        </div>

        <ul className="mt-[0.8svh] md:mt-3 flex flex-wrap gap-1.5 md:gap-2">
            {items.map((p) => (
                <li
                    key={p}
                    data-lead-stat
                    style={{ opacity: 0 }}
                    className="font-mono text-sm text-foreground/70 border border-foreground/15 px-2.5 py-0.5 md:px-3 md:py-1 leading-tight"
                >
                    {p}
                </li>
            ))}
        </ul>
    </div>
);
