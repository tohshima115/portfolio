import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark, LOGO_MARK_TOTAL_MS } from './LogoMark';

// 初回訪問時のみ表示するロゴスプラッシュ。
// 白背景 + ロゴマークの展開アニメーションのみを再生し、完走後は
// レイヤーごとフェードアウトして DOM から消える (Hero に常駐しない)。

const HOLD_MS = 250;
const FADE_MS = 550;

export const LogoIntroOverlay = () => {
    const [mounted, setMounted] = useState(true);
    const [fadingOut, setFadingOut] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setFadingOut(true), LOGO_MARK_TOTAL_MS + HOLD_MS);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <AnimatePresence>
            {mounted && (
                <motion.div
                    aria-hidden
                    className="fixed inset-0 z-[70] flex items-center justify-center"
                    style={{
                        pointerEvents: fadingOut ? 'none' : 'auto',
                        // #hero-boot-overlay と同じ地色にして、boot overlay が
                        // フェードアウトするときに背景が切り替わって見えないようにする。
                        backgroundColor: 'var(--color-background)',
                    }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: fadingOut ? 0 : 1 }}
                    transition={{ duration: FADE_MS / 1000, ease: 'easeOut' }}
                    onAnimationComplete={() => {
                        if (fadingOut) setMounted(false);
                    }}
                >
                    <LogoMark />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
