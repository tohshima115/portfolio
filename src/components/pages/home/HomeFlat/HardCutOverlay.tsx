import { motion } from 'framer-motion';

// セクション間ハードカット用の白フラッシュ overlay。
// SiteHeader の z-[100] より上 (z-[110]) に乗せて画面全体を一瞬覆う。
// cover 120ms ease-out → (peak で中身を差し替え) → reveal 120ms ease-in。
// reduced motion 環境では即時切替に退化させる (フラッシュ skip)。

export type CutPhase = 'idle' | 'cover' | 'reveal';

interface Props {
    phase: CutPhase;
    reducedMotion: boolean;
}

const COVER_S = 0.12;
const REVEAL_S = 0.12;

export const HardCutOverlay: React.FC<Props> = ({ phase, reducedMotion }) => {
    if (reducedMotion) return null;
    const isCovering = phase === 'cover';
    const isRevealing = phase === 'reveal';
    const opacity = isCovering ? 1 : isRevealing ? 0 : 0;
    const duration = isCovering ? COVER_S : isRevealing ? REVEAL_S : 0;
    const ease = isCovering ? 'easeOut' : 'easeIn';
    return (
        <motion.div
            aria-hidden
            initial={false}
            animate={{ opacity }}
            transition={{ duration, ease }}
            className="fixed inset-0 z-[110] pointer-events-none bg-white"
        />
    );
};
