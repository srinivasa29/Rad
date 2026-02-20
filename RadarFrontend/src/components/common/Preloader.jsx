import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Preloader = ({ children }) => {
    const location = useLocation();

    // Check if we should skip preloader based on navigation state or session storage
    const shouldSkip = location.state?.skipPreloader || sessionStorage.getItem('hasVisited');

    const [isLoading, setIsLoading] = useState(!shouldSkip && location.pathname === '/');

    useEffect(() => {
        if (isLoading) {
            sessionStorage.setItem('hasVisited', 'true');
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 2200);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    return (
        <>
            { }
            <div className={isLoading ? "h-screen overflow-hidden" : ""}>
                {children}
            </div>

            { }
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="preloader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                        className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center font-['Plus_Jakarta_Sans']"
                    >
                        { }
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-sky-500/5 rounded-full blur-[100px] animate-pulse" />
                            <div className="absolute bottom-[20%] right-[20%] w-[30vw] h-[30vw] bg-purple-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-8">
                            { }
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="relative"
                            >
                                { }
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-sky-500/30 blur-3xl rounded-full"
                                />
                                <div className="relative p-1 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-2xl backdrop-blur-md">
                                    <img
                                        src="/radar-logo-final.jpg"
                                        alt="Radar"
                                        className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
                                    />
                                </div>
                            </motion.div>

                            { }
                            <div className="text-center space-y-3">
                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                    className="text-4xl md:text-5xl font-black text-white tracking-tighter"
                                >
                                    RADAR
                                </motion.h1>

                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "100%", opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="h-[1px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent w-full"
                                />

                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    className="text-xs md:text-sm text-sky-500 font-bold tracking-[0.3em] uppercase"
                                >
                                    The Adaptive Interface
                                </motion.p>
                            </div>

                            { }
                            <div className="w-32 h-[2px] bg-white/5 rounded-full mt-6 overflow-hidden relative">
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent w-1/2 h-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Preloader;
