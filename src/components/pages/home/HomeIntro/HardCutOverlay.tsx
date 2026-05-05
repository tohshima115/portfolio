import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

// Hero → HomeStack 切替時の白フラッシュ overlay。
// HomeIntro が phase='scroll' になった瞬間 display:none で消えても
// reveal の白フラッシュが消える挙動が見えるよう、document.body へ Portal で
// 直接マウントする (HomeIntro outer から独立)。

export type CutPhase = 'idle' | 'cover' | 'reveal';

interface Props {
    phase: CutPhase;
    reducedMotion: boolean;
}

const COVER_S = 0.12;
const REVEAL_S = 0.12;

export const HardCutOverlay: React.FC<Props> = ({ phase, reducedMotion }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (reducedMotion) return null;
    if (typeof document === 'undefined') return null;

    const isCovering = phase === 'cover';
    const isRevealing = phase === 'reveal';
    const opacity = isCovering ? 1 : isRevealing ? 0 : 0;
    const duration = isCovering ? COVER_S : isRevealing ? REVEAL_S : 0;
    const ease = isCovering ? 'easeOut' : 'easeIn';

    return createPortal(
        <motion.div
            aria-hidden
            initial={false}
            animate={{ opacity }}
            transition={{ duration, ease }}
            className="fixed inset-0 z-[110] pointer-events-none bg-white"
        />,
        document.body,
    );
};
