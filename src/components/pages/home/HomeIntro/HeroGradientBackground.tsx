import { useEffect, useRef } from 'react';

// Hero (ファーストビュー) の背景。
// FourClock (別プロジェクト) の options 画面で使っている「下中央起点のドーム型
// radial-gradient (6段階) + canvas生成グレインのoverlay合成」をそのまま踏襲し、
// 配色だけサイトのブランドカラー (--color-logo 系, 緑) に寄せて再構成したもの。
export const HeroGradientBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 180% 90% at 50% 100%, var(--color-background) 0%, var(--color-hero-gradient-2) 34%, var(--color-hero-gradient-3) 47%, var(--color-hero-gradient-4) 68%, var(--color-hero-gradient-5) 95%, var(--color-hero-gradient-6) 100%)',
                }}
            />
            <GrainLayer />
            {/*
              楕円の半径が画面幅より大きいため、画面下端でも中央から少し外れる
              だけで 0% の白から次の色相に寄ってしまい、次セクションの
              --color-background と食い違う帯ができる。ここで確実に
              --color-background へ収束させて継ぎ目を消す。
              ノイズレイヤーより上に重ねることで、明るい部分でノイズが
              overlay 合成によって沈んで見える (くすむ) のもここで隠れる。
            */}
            <div
                className="absolute inset-x-0 bottom-0 h-[26vh]"
                style={{
                    background: 'linear-gradient(to bottom, transparent 0%, var(--color-background) 90%)',
                }}
            />
        </div>
    );
};

// canvas でランダムなグレースケールノイズを生成し、overlay 合成でグラデーションの
// 帯 (バンディング) を潰すノイズオーバーレイ。FourClock の GrainLayer と同じ実装。
const GrainLayer = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = ctx.createImageData(size, size);
        for (let i = 0; i < data.data.length; i += 4) {
            const v = (Math.random() * 255) | 0;
            data.data[i] = v;
            data.data[i + 1] = v;
            data.data[i + 2] = v;
            data.data[i + 3] = 255;
        }
        ctx.putImageData(data, 0, 0);

        el.style.backgroundImage = `url(${canvas.toDataURL()})`;
    }, []);

    return (
        <div
            ref={ref}
            className="absolute inset-0 pointer-events-none opacity-[0.12] mix-blend-overlay"
            style={{ backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }}
        />
    );
};
