import React from 'react';

export const FloorPlane = () => {
    return (
        <div className="absolute inset-0" style={{ transform: "translateZ(0px)" }}>
            {/* Infinite Grid */}
            <div
                className="absolute inset-0 opacity-[0.2]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
                }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full border-dashed" />
        </div>
    );
};
