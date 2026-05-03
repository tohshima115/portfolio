import React from 'react';

export const FloorPlane = () => {
    return (
        <div className="absolute inset-0" style={{ transform: "translateZ(0px)" }}>
            {/* Infinite Grid - 親の inset-0 から大きく外側へはみ出させて、
                rotateX のパース感が画面端まで届くようにする。
                CSS gradient 2 枚なので面積を広げてもほぼコストゼロ。 */}
            <div
                className="absolute opacity-[0.4]"
                style={{
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                    maskImage: 'radial-gradient(circle at center, black 35%, transparent 65%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 35%, transparent 65%)'
                }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-foreground/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-foreground/5 rounded-full border-dashed" />
        </div>
    );
};
