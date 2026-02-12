import React, { useRef, useState } from 'react';

export const PrtsInterface = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    // マウスの動きに合わせて傾きを計算する
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        const { clientWidth, clientHeight } = containerRef.current;
        const { clientX, clientY } = e.nativeEvent;

        // 画面中心からの距離を計算 (-1 〜 1 の範囲)
        const centerX = clientWidth / 2;
        const centerY = clientHeight / 2;

        // 感度調整（数字を小さくすると動きが小さくなる）
        const sensitivity = 15;

        // マウス位置に応じて回転角度を計算
        // Y軸回転はX座標に、X軸回転はY座標（逆向き）に依存
        // clientX はウィンドウ全体の座標なので、要素内の相対座標を使うべきだが、
        // 全画面表示(w-full h-screen)ならこれでもOK。より厳密にするなら rect を使う。
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const rotateY = ((x - centerX) / centerX) * sensitivity;
        const rotateX = ((y - centerY) / centerY) * -sensitivity;

        setRotation({ x: rotateX, y: rotateY });
    };

    // マウスが外れたらリセット（お好みで）
    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
    };

    return (
        <div
            className="w-full h-screen bg-[#f2f2f2] overflow-hidden flex items-center justify-center relative select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={containerRef}
        >
            {/* 装飾: 四隅のボケ（被写界深度っぽい表現）
        backdrop-filterを使って擬似的に奥や手前がボケているように見せます
      */}
            <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-t from-white/80 via-transparent to-white/80" />
            <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-r from-white/80 via-transparent to-white/80" />

            {/* 3Dシーンのコンテナ */}
            <div
                className="relative w-[90%] max-w-4xl aspect-video transition-transform duration-100 ease-out"
                style={{
                    // perspective: 奥行きの強さ。小さいほどパースがきつくなる（広角レンズ風）
                    perspective: '1000px',
                }}
            >
                {/* 傾く平面 (Plane) */}
                <div
                    className="w-full h-full bg-white shadow-2xl border border-gray-200 relative"
                    style={{
                        transformStyle: 'preserve-3d', // 子要素の3D配置を有効化
                        transform: `
              rotateX(${10 + rotation.x}deg) 
              rotateY(${rotation.y}deg) 
              rotateZ(-2deg)
            `, // デフォルトで少し傾けておく(10deg, -2deg)
                    }}
                >
                    {/* コンテンツ: 少し浮かせる (translateZ) */}
                    <div
                        className="absolute top-10 left-10 text-4xl font-bold text-gray-800 tracking-tighter"
                        style={{ transform: 'translateZ(40px)' }} // 平面より40px浮かせる
                    >
                        PRTS
                        <div className="text-xs font-normal tracking-widest text-gray-400 mt-1">
                            SYNTHESIZE INFORMATION
                        </div>
                    </div>

                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                        style={{ transform: 'translateZ(20px)' }} // 平面より20px浮かせる
                    >
                        <div className="bg-black text-white px-2 py-1 text-xs font-mono mb-2 inline-block">
                            USERNAME : [ Kal'tsit ]
                        </div>
                        <div className="text-gray-300 text-sm tracking-[0.5em]">
                            {'>>>>>>'}
                        </div>
                    </div>

                    {/* 装飾的なラインなど */}
                    <div className="absolute bottom-10 right-10 w-20 h-1 bg-lime-400" style={{ transform: 'translateZ(10px)' }} />
                </div>
            </div>
        </div>
    );
};
