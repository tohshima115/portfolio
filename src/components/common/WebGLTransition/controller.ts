/**
 * WebGL 遷移の制御エントリポイント。
 *
 * `playWebGLTransition('/works')` を呼ぶと CustomEvent を window に送出する。
 * オーバーレイコンポーネント側がこれを購読し、GSAP タイムラインを再生する。
 *
 * 視覚表現はあとで差し替える前提のため、controller は「いつ」「どこへ」だけ持つ。
 */

export const TRANSITION_EVENT = 'webgl-transition:play' as const;

export interface PlayTransitionDetail {
    /** 遷移先 URL (絶対 path)。null の場合は遷移なしで効果のみ再生 */
    url: string | null;
    /** Cover フェーズの長さ (sec)。デフォルト 0.6 */
    coverDuration?: number;
    /** Reveal フェーズの長さ (sec)。デフォルト 0.6 */
    revealDuration?: number;
}

/**
 * トランジションを発火する。
 * - url を渡すと cover 完了後に astro の navigate() が呼ばれる
 * - 直接呼んでも動くが、ScrollTransition / リンクハンドラなどから呼ぶ想定
 */
export function playWebGLTransition(detail: PlayTransitionDetail): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<PlayTransitionDetail>(TRANSITION_EVENT, { detail }));
}
