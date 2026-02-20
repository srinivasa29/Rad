import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, BarChart3, Bitcoin, Euro, PoundSterling, CandlestickChart, Activity, Globe } from "lucide-react";


const MarketBar = ({ height, delay, index }) => (
    <motion.div
        initial={{ height: "20%" }}
        animate={{ height: [`${height}%`, `${Math.max(10, height - 20)}%`, `${Math.min(100, height + 20)}%`] }}
        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, repeatType: "reverse", delay }}
        className={`w-2 mx-1 rounded-t-sm opacity-60 ${index % 3 === 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
        style={{
            boxShadow: index % 3 === 0 ? "0 -2px 10px rgba(248, 113, 113, 0.4)" : "0 -2px 10px rgba(52, 211, 153, 0.4)"
        }}
    />
);

const OrbitItem = ({ children, radius, angle, speed }) => {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2 flex items-center justify-center"
            style={{ width: 0, height: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        >
            <div
                className="absolute"
                style={{ transform: `translateX(${radius}px)` }} 
            >
                {}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
                    className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl hover:scale-110 transition-transform"
                >
                    <div className="text-emerald-400">
                        {children}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default function MarketFloorAnimation() {
    
    const bars = Array.from({ length: 20 }).map((_, i) => ({
        height: Math.floor(Math.random() * 60) + 20,
        delay: Math.random() * 2
    }));

    return (
        <div className="relative w-full h-[500px] flex items-end justify-center perspective-[1200px] overflow-visible">

            {}
            <div
                className="relative flex items-center justify-center transform-style-3d"
                style={{ transform: "rotateX(60deg) scale(1.2)" }}
            >
                {}
                <div className="absolute inset-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 border-[1px] border-emerald-500/20 rounded-full animate-[spin_120s_linear_infinite]" />
                <div className="absolute inset-0 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 border-[1px] border-emerald-500/10 rounded-full border-dashed animate-[spin_80s_linear_infinite_reverse]" />

                {}
                <div className="absolute flex items-end justify-center w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2" style={{ transform: "rotateX(-60deg)" }}>
                    {}
                    <div className="flex items-end gap-1 h-32 w-full justify-center opacity-80" style={{ transform: "translateY(50px)" }}>
                        {bars.map((bar, i) => (
                            <MarketBar key={i} index={i} height={bar.height} delay={bar.delay} />
                        ))}
                    </div>
                </div>

                {}
                {}
                <div className="absolute inset-0 flex items-center justify-center">
                    <OrbitItem radius={180} speed={50}><DollarSign size={24} /></OrbitItem>
                    <OrbitItem radius={-180} speed={50}><Euro size={24} /></OrbitItem>
                </div>

                {}
                <div className="absolute inset-0 flex items-center justify-center">
                    <OrbitItem radius={260} speed={70}><Bitcoin size={24} className="text-orange-400" /></OrbitItem>
                    <OrbitItem radius={-260} speed={70}><Activity size={24} /></OrbitItem>
                    <OrbitItem radius={260} speed={70} startAngle={90}><TrendingUp size={24} /></OrbitItem>
                </div>

                {}
                <div className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        animate={{ boxShadow: ["0 0 20px #10b981", "0 0 60px #10b981", "0 0 20px #10b981"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-32 h-32 bg-slate-900 rounded-full border-4 border-emerald-500 flex items-center justify-center relative z-20"
                    >
                        <img src="/radar-logo-final.jpg" className="w-full h-full object-cover rounded-full opacity-90" />

                        {}
                        <div className="absolute bottom-0 w-full h-20 bg-emerald-500/20 blur-xl rounded-full" style={{ transform: "translateY(50%) rotateX(-90deg)" }}></div>
                    </motion.div>
                </div>
            </div>

        </div>
    );
}
