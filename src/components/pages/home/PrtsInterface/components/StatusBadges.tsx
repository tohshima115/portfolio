import React from 'react';
import { RotateCcw } from 'lucide-react';

const handleReplayIntro = () => {
    try {
        sessionStorage.removeItem('prts-intro-seen');
    } catch {
        /* ignore */
    }
    document.documentElement.classList.remove('prts-skip-intro');
    (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro = false;
    window.location.reload();
};

export const StatusBadges = () => {
    return (
        <div className="flex flex-row gap-3 items-center mt-10 mr-6 md:mt-20 md:mr-10 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto self-end">
            <button
                type="button"
                onClick={handleReplayIntro}
                className="group px-3 py-1.5 bg-background/50 border border-foreground/10 rounded-full backdrop-blur-md shadow-sm hover:border-accent transition-colors flex items-center gap-2 cursor-pointer"
                aria-label="ロゴアニメーションを再生する"
            >
                <span className="flex items-center gap-1.5 font-mono text-3xs text-muted-foreground group-hover:text-accent tracking-widest transition-colors">
                    <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" />
                    REPLAY_INTRO
                </span>
            </button>
        </div>
    );
};
