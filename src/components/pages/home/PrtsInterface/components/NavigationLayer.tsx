import { motion } from 'framer-motion';

export const NavigationLayer = () => {
    const navItems = [
        { label: "ARCHIVES", href: "/works", sub: "Projects" },
        { label: "LOGS", href: "/blog", sub: "Dev & Thoughts" },
        { label: "PROFILE", href: "/about", sub: "Who I Am" },
        { label: "COMM", href: "/contact", sub: "Contact" },
    ];

    return (
        <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
            style={{ transform: "translateZ(160px)" }}
        >
            <div className="relative w-[90vw] max-w-7xl h-[80vh] flex flex-col justify-between">
                {/* Top Right: Status & Feed */}
                <div className="self-end flex flex-col sm:flex-row gap-4 items-end sm:items-center mt-20 mr-10 opacity-80 hover:opacity-100 transition-opacity">
                    <a href="/rss.xml" className="group px-4 py-2 bg-background/50 border border-foreground/10 rounded-full backdrop-blur-md shadow-sm hover:border-accent transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                        <span className="font-mono text-[10px] text-muted-foreground group-hover:text-accent tracking-widest">SIGNAL_FEED</span>
                    </a>
                    <div className="px-4 py-2 bg-background/50 border border-foreground/10 rounded-full backdrop-blur-md shadow-sm flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground tracking-widest">SYSTEM ONLINE</span>
                    </div>
                </div>

                {/* Bottom Left: System Guide */}
                <div className="absolute bottom-20 left-10 hidden lg:block">
                    <a href="/system" className="font-mono text-[10px] text-muted-foreground hover:text-accent tracking-[0.2em] transition-colors border-b border-transparent hover:border-accent pb-1 flex items-center gap-2 group">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 overflow-hidden inline-block">{">>"}</span>
                        SYSTEM_GUIDE
                    </a>
                </div>

                {/* Bottom Center: Main Navigation */}
                <div className="mt-auto mb-20 self-center w-full max-w-4xl px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {navItems.map((item) => (
                            <a key={item.label} href={item.href} className="group relative w-full aspect-[2/1] perspective-500">
                                {/* Shadow on floor from button */}
                                <div className="absolute top-20 left-4 right-4 h-4 bg-black/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                {/* Button Body */}
                                <div className="absolute inset-0 bg-white/90 border border-foreground/5 group-hover:border-accent/60 transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-lg group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] group-hover:-translate-y-2 group-hover:scale-105 backdrop-blur-sm overflow-hidden">
                                    {/* Scanline background - subtle */}
                                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)", backgroundSize: "100% 4px" }} />

                                    <span className="font-mono text-sm md:text-base tracking-widest text-foreground group-hover:text-accent transition-colors z-10 font-bold">{item.label}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide group-hover:text-accent/80 transition-colors z-10">{item.sub}</span>
                                </div>

                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-foreground/20 group-hover:border-accent transition-colors duration-300" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-foreground/20 group-hover:border-accent transition-colors duration-300" />

                                {/* Active/Hover scanline effect */}
                                <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-10 pointer-events-none">
                                    <div className="w-full h-[200%] bg-gradient-to-b from-transparent via-accent to-transparent animate-[scan_2s_linear_infinite]" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
