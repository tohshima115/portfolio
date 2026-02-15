import { motion } from 'framer-motion';

export const MainTitle = () => {
    return (
        <motion.div
            className="absolute flex flex-col items-center justify-center text-center preserve-3d pointer-events-none"
            style={{
                transform: "translateZ(80px)",
                marginTop: "-150px"
            }}
        >
            <div className="relative isolate">
                <div className="absolute -inset-10 bg-gradient-to-tr from-yellow-400/10 to-transparent blur-2xl rounded-full opacity-30" />

                <h1
                    className="text-[8vw] md:text-[6rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[0.85] select-none"
                    style={{ textShadow: '0 0 1px rgba(255,255,255,0.5)' }}
                >
                    SHOGO<br />TOYOSHIMA
                </h1>

                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="h-[2px] w-12 bg-yellow-400"></div>
                    <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-yellow-500 font-bold uppercase">
                        Design Engineer
                    </p>
                    <div className="h-[2px] w-12 bg-yellow-400"></div>
                </div>
            </div>
        </motion.div>
    );
};
