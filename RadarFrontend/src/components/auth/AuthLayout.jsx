import React from 'react';





import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt';

export default function AuthLayout({ children }) {
    const defaultTiltOptions = {
        reverse: false,
        max: 2,
        perspective: 1000,
        scale: 1.00,
        speed: 1000,
        transition: true,
        axis: null,
        reset: true,
        easing: "cubic-bezier(.03,.98,.52,.99)",
    };

    return (
        <div className="min-h-screen flex font-sans">
            { }
            <div className="hidden lg:flex w-7/12 bg-gradient-to-br from-[#103E46] via-[#1A7870] to-[#42C0A5] text-white flex-col justify-center p-20 relative overflow-hidden">
                { }
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#93EBDD] rounded-full blur-[150px]"
                    />
                    <motion.div
                        animate={{ rotate: -360, scale: [1, 1.5, 1] }}
                        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                        className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] bg-[#22D3EE] rounded-full blur-[150px]"
                    />
                </div>


                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-3xl"
                >

                    <Link to="/" className="flex items-center gap-5 mb-12 hover:opacity-90 transition-opacity">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#6FFFE9]/20 blur-2xl rounded-full" />
                            <img
                                src="/radar-logo-final.jpg"
                                alt="Radar Icon"
                                className="w-16 h-16 rounded-full shadow-2xl border-2 border-white/20 object-cover relative z-10"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-4xl font-black tracking-tighter font-['Plus_Jakarta_Sans'] text-white leading-none">RADAR</span>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#6FFFE9] opacity-80 uppercase mt-1">Invest & Trade Smarter</span>
                        </div>
                    </Link>

                    <div className="relative">
                        <h1 className="text-6xl font-extrabold leading-tight mb-8 font-['Plus_Jakarta_Sans'] drop-shadow-sm tracking-tight relative z-10">
                            Master the Markets <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6FFFE9] to-[#ffffff]">Multi-Asset Analytics</span>
                        </h1>
                    </div>







                    <p className="text-xl text-[#B9F3EA] max-w-2xl leading-relaxed font-['Plus_Jakarta_Sans'] font-medium">
                        Radar helps you track and analyze <span className="text-white font-semibold">Stocks, Crypto, and Forex</span> in one place.
                        Get real-time data, interactive charts, and smart insights to make faster, informed decisions.
                    </p>

                </motion.div>

                <div className="absolute bottom-10 left-20 text-xs text-[#8ED6CC]/60 font-['Plus_Jakarta_Sans']">
                    © 2026 Radar Analytics. All rights reserved.
                </div>
            </div>

            { }
            <div className="w-full lg:w-5/12 flex items-center justify-center p-6 relative bg-gradient-to-br from-[#f0fdfa] via-[#e6fffa] to-[#f0fdfa]">
                { }
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-10 right-10 w-96 h-96 bg-[#42C0A5]/10 rounded-full blur-[80px]"
                    />
                    <motion.div
                        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-10 left-10 w-96 h-96 bg-[#1A7870]/5 rounded-full blur-[80px]"
                    />
                </div>

                <Tilt options={defaultTiltOptions} className="w-full max-w-[480px] relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/90 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(26,120,112,0.15)] border border-white hover:shadow-[0_40px_100px_-15px_rgba(26,120,112,0.2)] transition-all duration-500"
                    >
                        {children}
                    </motion.div>
                </Tilt>
            </div>
        </div>
    );
}
