import React from 'react';
import { motion } from 'framer-motion';

/**
 * 蟷ｾ菴募ｭｦ逧・ヶ繝ｭ繝・け縺ｮ髮・粋菴難ｼ・繧ｻ繝・ヨ蛻・ｼ・
 * 縺薙ｌ繧・縺､荳ｦ縺ｹ縺ｦ繝ｫ繝ｼ繝励＆縺帙∪縺吶・
 */
const GeometricPatternSet = () => (
    <div className="relative w-1/2 h-full flex-shrink-0">
        {/* --- 螟ｧ縺阪↑繝吶・繧ｹ繝悶Ο繝・け・育區繧・･ｵ阮・＞繧ｰ繝ｬ繝ｼ・・--- */}
        <div className="absolute top-[10%] left-[5%] w-[30%] h-[40%] bg-white/40 shadow-[0_0_40px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute top-[40%] left-[40%] w-[25%] h-[50%] bg-white/30"></div>
        <div className="absolute top-[20%] left-[70%] w-[15%] h-[20%] bg-white/50"></div>

        {/* --- 譫邱壹・縺ｿ縺ｮ繝悶Ο繝・け --- */}
        <div className="absolute top-[15%] left-[35%] w-[20%] h-[30%] border border-gray-300/40"></div>
        <div className="absolute top-[60%] left-[10%] w-[15%] h-[15%] border border-gray-300/60"></div>

        {/* --- 繝・ず繧ｿ繝ｫ繝弱う繧ｺ繝ｻ繧ｰ繝ｪ繝・メ鬚ｨ縺ｮ繝ｩ繧､繝ｳ --- */}
        <div className="absolute top-[30%] left-[60%] w-[120px] h-[1px] bg-gray-300"></div>
        <div className="absolute top-[31%] left-[62%] w-[80px] h-[2px] bg-gray-300/50"></div>
        <div className="absolute top-[75%] left-[45%] w-[200px] h-[1px] bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>

        {/* --- 繝峨ャ繝医・繝医Μ繧ｯ繧ｹ・育せ蟄励ヶ繝ｭ繝・け縺ｮ繧医≧縺ｪ讓｡讒假ｼ・--- */}
        <div className="absolute top-[50%] left-[80%] w-[100px] h-[80px] opacity-20"
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
        </div>
        <div className="absolute top-[20%] left-[15%] w-[60px] h-[60px] opacity-10"
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
        </div>

        {/* --- 繧ｯ繝ｭ繧ｹ・亥香蟄暦ｼ峨・繝ｼ繧ｫ繝ｼ --- */}
        <div className="absolute top-[25%] left-[25%] w-4 h-4 opacity-30">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black"></div>
        </div>
        <div className="absolute top-[65%] left-[85%] w-6 h-6 opacity-20">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black"></div>
        </div>

        {/* --- 讌ｵ蟆上・繧｢繧ｯ繧ｻ繝ｳ繝医ヶ繝ｭ繝・け・磯ｻ偵・繧ｰ繝ｬ繝ｼ・・--- */}
        <div className="absolute top-[45%] left-[45%] w-2 h-2 bg-gray-400/40"></div>
        <div className="absolute top-[80%] left-[30%] w-3 h-1 bg-gray-400/50"></div>
    </div>
);

/**
 * 謇句燕縺ｫ驟咲ｽｮ縺吶ｋ邏ｰ縺九↑繝代・繝・ｾ､・域掠縺丞虚縺擾ｼ・
 */
const ForegroundPatternSet = () => (
    <div className="relative w-1/2 h-full flex-shrink-0 pointer-events-none">
        {/* 隕門ｷｮ蜉ｹ譫懊ｒ逕溘・縺溘ａ縺ｮ縲∵焔蜑阪・豬ｮ驕翫ヱ繝ｼ繝・*/}
        <div className="absolute top-[18%] left-[28%] w-[40px] h-[4px] bg-gray-300/80"></div>
        <div className="absolute top-[58%] left-[75%] w-[2px] h-[20px] bg-gray-300/80"></div>
        <div className="absolute top-[85%] left-[15%] w-[8px] h-[8px] border border-gray-400"></div>

        {/* 阮・＞譁・ｭ励・谿矩ｪｸ・・UI繧峨＠縺包ｼ・*/}
        <div className="absolute top-[40%] left-[8%] text-4xs font-mono text-gray-400/30 tracking-widest rotate-90 origin-left">
            SYS.ARCHIVE_DATA //
        </div>
    </div>
);

/**
 * PRTS鬚ｨ 謚ｽ雎｡蟷ｾ菴募ｭｦ閭梧勹繧ｳ繝ｳ繝昴・繝阪Φ繝・(Framer Motion Refactor for Persistence)
 */
const Background: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-neutral-100 pointer-events-none">

            {/* LAYER 1: 閭梧勹繝ｬ繧､繝､繝ｼ・医ｆ縺｣縺上ｊ蜍輔￥螟ｧ縺阪↑繝悶Ο繝・け鄒､・・*/}
            <motion.div
                className="absolute inset-0 flex w-[200%]"
                initial={{ x: "0%" }}
                animate={{ x: "-50%" }}
                transition={{ duration: 150, ease: "linear", repeat: Infinity }}
                style={{ opacity: 0.6 }}
            >
                <GeometricPatternSet />
                <GeometricPatternSet />
            </motion.div>

            {/* LAYER 2: 蜑肴勹繝ｬ繧､繝､繝ｼ・亥ｰ代＠譌ｩ縺丞虚縺丞ｰ上＆縺ｪ繝代・繝・ｾ､・・*/}
            <motion.div
                className="absolute inset-0 flex w-[200%]"
                initial={{ x: "0%" }}
                animate={{ x: "-50%" }}
                transition={{ duration: 90, ease: "linear", repeat: Infinity }}
                style={{ opacity: 0.4 }}
            >
                <ForegroundPatternSet />
                <ForegroundPatternSet />
            </motion.div>

            {/* LAYER 3: 逕ｻ髱｢蜈ｨ菴薙・雉ｪ諢溯ｪｿ謨ｴ・医ン繝阪ャ繝亥柑譫懶ｼ・*/}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.04)_100%)]"></div>
        </div>
    );
};

export default Background;
