import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ToyoshimaLogo } from './ToyoshimaLogo';

export const MainTitle = () => {
    // タイミング調整
    const TIMING = {
        logoMoveStart: 1.4,
        logoMoveDuration: 0.8,
        textAppearStart: 1.6,
        textAppearDuration: 0.8,
    };

    // カスタムベジェ (だんだん早くなってだんだんゆっくりになる = Sigmoid-like)
    const moveEase = [0.65, 0, 0.35, 1] as const;

    // レイアウト定数 (Desktop)
    // Logoの正確なサイズ計算
    const UNIT = 10;
    const GRID_SIZE = UNIT * 5; // 50px
    const GRID_GAP = UNIT * 3;  // 30px
    // 3列の合計幅 = (SIZE * 3) + (GAP * 2)
    const LOGO_CONTENT_WIDTH = (GRID_SIZE * 3) + (GRID_GAP * 2); // 210px
    const LOGO_PADDING = 32; // p-4 * 2 = 32px
    const LOGO_FULL_WIDTH = LOGO_CONTENT_WIDTH + LOGO_PADDING; // 242px

    const GAP = 64; // md:gap-16 = 64px

    // タイトル幅計測
    const [titleWidth, setTitleWidth] = useState(0);
    const titleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const measure = () => {
            if (titleRef.current) {
                // padding-rightなどを考慮したスクロール幅、またはoffsetWidth
                // scrollWidthの方が安全かもしれないが見切れ対策で親のpaddingを増やすのでoffsetWidthで十分
                setTitleWidth(titleRef.current.offsetWidth);
            }
        };
        measure();
        const timer = setTimeout(measure, 100);
        window.addEventListener('resize', measure);
        return () => {
            window.removeEventListener('resize', measure);
            clearTimeout(timer);
        };
    }, []);

    // 座標計算
    const logoFinalX = -(GAP + titleWidth) / 2;
    // Logoの中心から見て、Titleの左端の位置 = Logo幅/2 + Gap
    // 画面中央(0)から見たTitleコンテナ(左端)の位置 = logoFinalX + (Logo幅/2 + Gap)
    // = -(Gap + TitleW)/2 + LogoW/2 + Gap
    // = (LogoW + Gap - TitleW) / 2
    const titleFinalX = (LOGO_FULL_WIDTH + GAP - titleWidth) / 2;

    const isReady = titleWidth > 0;

    return (
        <motion.div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
                transform: "translate(-50%, -50%) translateZ(80px)",
                marginTop: "-150px",
                width: 0, height: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            {/* ---------------- Desktop Layout ---------------- */}

            {/* Logo Section */}
            <motion.div
                className="hidden md:flex absolute top-1/2 left-1/2 items-center justify-center p-4 z-20"
                style={{
                    // 幅を固定値で指定してレイアウト崩れを防ぐ
                    width: LOGO_FULL_WIDTH,
                    height: LOGO_FULL_WIDTH, // 正方形と仮定(高さも同様の計算になるが、ここでは幅が重要)
                    x: "-50%",
                    y: "-50%",
                    willChange: "transform" // パフォーマンス最適化
                }}
                animate={{
                    x: `calc(-50% + ${isReady ? logoFinalX : 0}px)`
                }}
                transition={{
                    delay: TIMING.logoMoveStart,
                    duration: TIMING.logoMoveDuration,
                    ease: moveEase
                }}
            >
                <div
                    className="absolute inset-0 bg-accent/20 blur-3xl rounded-full"
                    style={{ transform: "translateZ(0)" }} // GPUレイヤー化
                />
                <ToyoshimaLogo unit={UNIT} initialDelay={0} phase3Delay={-0.1} />
            </motion.div>

            {/* Title Section */}
            <div
                ref={titleRef}
                className="hidden md:block absolute top-1/2 left-1/2 z-10"
                style={{
                    transform: `translate(${titleFinalX}px, -50%)`,
                    whiteSpace: "nowrap",
                    opacity: isReady ? 1 : 0
                }}
            >
                {/* テキスト見切れ対策: pr-8 (padding right) を追加 */}
                <div className="overflow-hidden pl-2 pr-8">
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{
                            delay: TIMING.textAppearStart,
                            duration: TIMING.textAppearDuration,
                            ease: "easeOut"
                        }}
                        style={{ willChange: "transform, opacity" }} // パフォーマンス最適化
                    >
                        <div
                            className="absolute -inset-10 bg-gradient-to-tr from-accent/20 to-transparent blur-2xl rounded-full opacity-60 pointer-events-none"
                            style={{ transform: "translateZ(0)" }} // GPUレイヤー化
                        />

                        <h1
                            className="text-[6rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 leading-[0.85] select-none"
                            style={{ textShadow: '0 0 1px rgba(0,0,0,0.1)' }}
                        >
                            TOYO<br />SHIMA
                        </h1>

                        <div className="mt-6 flex items-center gap-4 w-full justify-start">
                            <div className="h-[2px] w-12 bg-accent"></div>
                            <p className="font-mono text-sm tracking-[0.3em] text-accent font-bold uppercase whitespace-nowrap">
                                Design Engineer
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ---------------- Mobile Layout ---------------- */}
            <motion.div
                className="md:hidden flex flex-col items-center justify-center p-4 relative"
                style={{ marginTop: "-200px" }}
            >
                <div className="relative z-20 mb-8">
                    <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
                    <ToyoshimaLogo unit={6} initialDelay={0} phase3Delay={0.5} />
                </div>

                <motion.div
                    className="flex flex-col items-center text-center z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3.5, duration: 0.8 }}
                >
                    <h1 className="text-[12vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 leading-[0.85]">
                        SHOGO<br />TOYOSHIMA
                    </h1>
                    <div className="mt-4 flex items-center gap-4 justify-center">
                        <div className="h-[2px] w-8 bg-accent"></div>
                        <p className="font-mono text-xs tracking-[0.2em] text-accent font-bold uppercase">
                            Design Engineer
                        </p>
                        <div className="h-[2px] w-8 bg-accent"></div>
                    </div>
                </motion.div>
            </motion.div>

        </motion.div>
    );
};
