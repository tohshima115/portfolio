import React, { useEffect } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import { StackHeroSection } from './sections/StackHeroSection';
import { WorksSection } from './sections/WorksSection';
import { BlogSection, type BlogPostItem } from './sections/BlogSection';
import { AboutSection } from './sections/AboutSection';
import { CTASection } from './sections/CTASection';
import { HomeFooter } from './sections/HomeFooter';

// HomeStack: Hero 直下のネイティブ縦スクロール本体。
// StackHero → Works → Blog → About → CTA の構成を縦に並べる。
// 各セクションが自分自身の pin (useScrollScene) を独立に持ち、
// 1つのセクションのアニメーションが終わったら pin を解除して通常スクロールで
// 次のセクションへつながる (セクションをまたいだ巨大な1本pinにはしない)。
//
// internal リンクは WebGL transition、外部リンクは通常遷移 (HomeIntro と同じ挙動)。

interface Props {
    blogPosts?: BlogPostItem[];
}

export const HomeStack: React.FC<Props> = ({ blogPosts = [] }) => {
    // pin 復元用 ScrollTrigger.refresh()。
    //
    // 各セクションの useScrollScene は gsap を dynamic import するので、
    // ScrollTrigger.create() が走るタイミングは「画像/フォント load 完了」
    // 「Lenis 初期化」と非同期で混ざる。初期計算した pin start/end が実レイアウト
    // とズレた状態で固定されると、リロード直後に「pin 自体が建たない」状態になる
    // (各セクションは invalidateOnRefresh: true で refresh を待っている)。
    //
    // SPA 遷移 (ロゴクリック → /) では JS が既にロード済で全 island が
    // 即マウントするためズレないが、hard reload では非同期 import の遅延が
    // 効いてズレる。明示的に window.load 後 + microtask 後の 2 タイミングで
    // refresh を叩いて、layout 確定後の値で pin 範囲を再計測する。
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let cancelled = false;
        const refresh = async () => {
            try {
                const stMod = await import('gsap/ScrollTrigger');
                if (cancelled) return;
                stMod.ScrollTrigger.refresh();
            } catch {
                /* gsap 未ロードならスキップ */
            }
        };
        // microtask 後 (各 section の useEffect が走り終わった後)
        const t1 = window.setTimeout(refresh, 0);
        // 画像/フォント等の load 完了後にもう一度
        const t2 = window.setTimeout(refresh, 200);
        const onLoad = () => refresh();
        if (document.readyState === 'complete') {
            window.setTimeout(refresh, 50);
        } else {
            window.addEventListener('load', onLoad, { once: true });
        }
        return () => {
            cancelled = true;
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.removeEventListener('load', onLoad);
        };
    }, []);

    const handleLinkClick = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest('a');
        if (
            target &&
            target.href &&
            !target.href.startsWith('javascript') &&
            !target.href.includes('#')
        ) {
            try {
                const url = new URL(target.href);
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    playWebGLTransition({
                        url: target.pathname + target.search + target.hash,
                    });
                }
            } catch {
                /* ignore */
            }
        }
    };

    return (
        <main
            className="relative w-full bg-background text-foreground"
            onClickCapture={handleLinkClick}
            data-home-stack
        >
            <StackHeroSection />
            <WorksSection />
            <BlogSection posts={blogPosts} />
            <AboutSection />
            <CTASection />
            <HomeFooter />
        </main>
    );
};
