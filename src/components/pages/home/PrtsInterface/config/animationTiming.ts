/**
 * MainTitle 関連のアニメーションタイミング設定 (単位: ms)
 * TOPページが開かれた瞬間 (0ms) を基準に、各アニメーションの発火タイミングを一元管理します。
 */

// ms を sec に変換するユーティリティ (framer-motion用)
export const msToS = (ms: number) => ms / 1000;

export const MAIN_TITLE_TIMING_MS = {
    // ==========================================
    // 1. 共通 (Desktop/Mobile)
    // ==========================================
    // ロゴの中央セルの明滅
    logoBlinkStart: 100,
    logoBlinkDuration: 300,

    // ロゴの拡大展開
    logoExpandStart: 1000,
    logoExpandDuration: 1000,

    // ==========================================
    // 2. Desktop (md以上)
    // ==========================================
    desktop: {
        // ロゴコンテナ自体の横移動
        logoMoveStart: 1600,
        logoMoveDuration: 800,

        // 肩書きテキスト群の出現
        textAppearStart: 3400,
        textAppearDuration: 800,

        // ロゴ後半: 上部両サイドの塗りつぶし
        logoFillSideStart: 2400,
        logoFillSideDuration: 300,
        logoFillSideStagger: 100, // 左右の時差

        // ロゴ後半: 中央列のドロップダウン
        logoDropCenterStart: 2800,
        logoDropCenterDuration: 800,
    },

    // ==========================================
    // 3. Mobile (md未満)
    // ==========================================
    mobile: {
        // テキスト群の出現
        textAppearStart: 3500,
        textAppearDuration: 800,

        // ロゴ後半: 上部両サイドの塗りつぶし
        logoFillSideStart: 3800,
        logoFillSideDuration: 300,
        logoFillSideStagger: 100, // 左右の時差

        // ロゴ後半: 中央列のドロップダウン
        logoDropCenterStart: 4200,
        logoDropCenterDuration: 800,
    }
} as const;

// Logo 用の型定義
export type LogoTimingProfile = {
    blink: { start: number; duration: number };
    expand: { start: number; duration: number };
    fill: { start: number; duration: number; stagger: number };
    drop: { start: number; duration: number };
};

// Desktop 用のロゴタイミングプロファイル
export const DESKTOP_LOGO_TIMING: LogoTimingProfile = {
    blink: { start: MAIN_TITLE_TIMING_MS.logoBlinkStart, duration: MAIN_TITLE_TIMING_MS.logoBlinkDuration },
    expand: { start: MAIN_TITLE_TIMING_MS.logoExpandStart, duration: MAIN_TITLE_TIMING_MS.logoExpandDuration },
    fill: { start: MAIN_TITLE_TIMING_MS.desktop.logoFillSideStart, duration: MAIN_TITLE_TIMING_MS.desktop.logoFillSideDuration, stagger: MAIN_TITLE_TIMING_MS.desktop.logoFillSideStagger },
    drop: { start: MAIN_TITLE_TIMING_MS.desktop.logoDropCenterStart, duration: MAIN_TITLE_TIMING_MS.desktop.logoDropCenterDuration },
};

// Mobile 用のロゴタイミングプロファイル
export const MOBILE_LOGO_TIMING: LogoTimingProfile = {
    blink: { start: MAIN_TITLE_TIMING_MS.logoBlinkStart, duration: MAIN_TITLE_TIMING_MS.logoBlinkDuration },
    expand: { start: MAIN_TITLE_TIMING_MS.logoExpandStart, duration: MAIN_TITLE_TIMING_MS.logoExpandDuration },
    fill: { start: MAIN_TITLE_TIMING_MS.mobile.logoFillSideStart, duration: MAIN_TITLE_TIMING_MS.mobile.logoFillSideDuration, stagger: MAIN_TITLE_TIMING_MS.mobile.logoFillSideStagger },
    drop: { start: MAIN_TITLE_TIMING_MS.mobile.logoDropCenterStart, duration: MAIN_TITLE_TIMING_MS.mobile.logoDropCenterDuration },
};
