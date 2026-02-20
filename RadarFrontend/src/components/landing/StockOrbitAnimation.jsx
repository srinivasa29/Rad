import React from 'react';
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, BarChart3, Wallet, Activity, PieChart, ArrowUpRight, Globe } from "lucide-react";

const OrbitIcon = ({ children, radius, angle, duration = 20, delay = 0 }) => {
    return (
        <motion.div
            className="absolute flex items-center justify-center"
            style={{
                width: "3rem",
                height: "3rem",
                left: "50%",
                top: "50%",
                marginLeft: "-1.5rem", 
                marginTop: "-1.5rem",
            }}
            animate={{
                rotate: 360,
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear",
                delay: -delay, 
            }}
        >
            <div
                style={{
                    transform: `translateY(-${radius}px) rotate(-${0}deg)`, 
                }}
                className="relative"
            >
                {}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: duration, repeat: Infinity, ease: "linear", delay: -delay }}
                    className="p-3 bg-[#103E46]/80 backdrop-blur-md border border-[#42C0A5]/40 rounded-full shadow-[0_0_15px_rgba(66,192,165,0.3)] text-[#6FFFE9]"
                >
                    {children}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default function StockOrbitAnimation() {
    const icons = [
        { icon: <TrendingUp size={20} />, radius: 140, delay: 0 },
        { icon: <DollarSign size={20} />, radius: 140, delay: 5 },
        { icon: <BarChart3 size={20} />, radius: 140, delay: 10 },
        { icon: <Activity size={20} />, radius: 140, delay: 15 },

        { icon: <Wallet size={20} />, radius: 220, delay: 2 },
        { icon: <PieChart size={20} />, radius: 220, delay: 8.6 },
        { icon: <ArrowUpRight size={20} />, radius: 220, delay: 15.3 },
    ];

    return (
        <div className="relative w-[500px] h-[500px] flex items-center justify-center">

            {}
            <div className="absolute inset-0 rounded-full border border-[#42C0A5]/10 w-[280px] h-[280px] m-auto" />
            <div className="absolute inset-0 rounded-full border border-[#42C0A5]/10 w-[440px] h-[440px] m-auto border-dashed opacity-50" />

            {}
            <motion.div
                className="relative z-20 w-32 h-32 rounded-full p-1 bg-gradient-to-br from-[#42C0A5] to-[#103E46] shadow-[0_0_40px_rgba(66,192,165,0.4)]"
                animate={{
                    boxShadow: ["0 0 20px rgba(66,192,165,0.2)", "0 0 50px rgba(66,192,165,0.6)", "0 0 20px rgba(66,192,165,0.2)"]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-[#103E46]">
                    <img
                        src="/radar-orbit-logo.png"
                        alt="Radar Central"
                        className="w-full h-full object-cover"
                    />
                </div>
            </motion.div>

            {}
            {icons.map((item, index) => (
                <OrbitIcon
                    key={index}
                    radius={item.radius}
                    delay={item.delay}
                    duration={item.radius > 150 ? 35 : 25} 
                >
                    {item.icon}
                </OrbitIcon>
            ))}

            {}
            <motion.div
                className="absolute w-2 h-2 bg-[#6FFFE9] rounded-full blur-[1px]"
                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: [0, 100], y: [0, -100] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                style={{ top: '40%', left: '40%' }}
            />
        </div>
    );
}
