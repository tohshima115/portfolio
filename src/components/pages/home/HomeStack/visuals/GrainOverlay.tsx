import { useEffect, useRef } from 'react';

// canvas でランダムなグレースケールノイズを生成し、overlay 合成でグラデーションの
// 帯 (バンディング) を潰すノイズオーバーレイ。Hero の GrainLayer と同じ実装を
// 共有コンポーネントとして切り出したもの (Footer と共用)。
export const GrainOverlay: React.FC<{ opacity?: number; className?: string }> = ({
    opacity = 0.12,
    className,
}) => {
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
            aria-hidden
            className={`absolute inset-0 pointer-events-none mix-blend-overlay ${className ?? ''}`}
            style={{
                opacity,
                backgroundRepeat: 'repeat',
                backgroundSize: '256px 256px',
            }}
        />
    );
};
