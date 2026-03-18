import React from 'react';
import { Globe, Zap, Users, Target, Merge, ScanSearch, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {

    const cards = [
        {
            title: "What Is Radar",
            description: "Radar is a real-time market research platform that brings together global market data, charts, indicators, and price movements into a single, structured interface for deeper analysis and informed decision-making.",
            visual: (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#348E87]/20 blur-xl rounded-full" />
                        <Globe size={64} className="relative z-10 opacity-80" stroke="#289dbc" strokeWidth={1.5} />
                        <div className="absolute -right-2 -top-2 bg-white p-1.5 rounded-full shadow-sm border border-[#348E87]/20">
                            <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Who Radar Is For",
            description: "Built for investors, traders, and market learners who want direct access to raw market data — whether researching long-term opportunities or closely observing short-term market behavior.",
            visual: (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5">
                    <div className="flex items-center gap-4 opacity-80">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-[#348E87]/10 rounded-2xl flex items-center justify-center border border-[#348E87]/20">
                                <Users size={24} stroke="#289dbc" />
                            </div>
                            <div className="h-1 w-8 bg-[#348E87]/20 rounded-full" />
                        </div>
                        <Target size={48} stroke="#289dbc" strokeWidth={1.5} />
                    </div>
                </div>
            )
        },
        {
            title: "Why Radar Exists",
            description: "Market data is scattered across platforms and tools. Radar exists to centralize that data, making market research faster, clearer, and more focused — without jumping between multiple sources.",
            visual: (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5">
                    <div className="relative p-6 border border-dashed border-[#348E87]/30 rounded-full">
                        <Merge size={48} className="opacity-80 rotate-90" stroke="#289dbc" strokeWidth={1.5} />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#348E87] rounded-full" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-[#348E87]/50 rounded-full" />
                    </div>
                </div>
            )
        },
        {
            title: "Research First. Trade Anywhere.",
            description: "Radar is designed purely for research and analysis. Users study markets, test ideas, and track assets on Radar, then execute trades on their preferred brokerage platforms.",
            visual: (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5">
                    <div className="flex gap-4 items-center">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-[#348E87]/10">
                            <ScanSearch size={32} stroke="#289dbc" />
                        </div>
                        <div className="w-8 h-[2px] bg-[#348E87]/30 border-t border-dashed border-[#348E87]" />
                        <div className="bg-gray-100 p-3 rounded-xl border border-gray-200 opacity-50">
                            <Layers size={32} stroke="#289dbc" />
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <section className="relative pt-20 pb-12 overflow-hidden min-h-screen flex flex-col justify-center">
            <div className="container mx-auto px-6 flex flex-col justify-center">

                { }
                <div className="text-center max-w-4xl mx-auto mb-14">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold tracking-tight text-gradient-oklab mb-6 leading-tight pb-2"
                    >
                        Understand markets.<br />Act confidently.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed font-light"
                    >
                        Radar is a real-time market research platform for observing and analyzing global markets in one structured interface.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            to="/register"
                            className="btn-gradient-light px-8 py-3.5 rounded-full font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-white/10 inline-block tracking-wide"
                        >
                            <span className="text-gradient-dark">Explore Radar</span>
                        </Link>
                    </motion.div>
                </div>

                { }
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group h-[390px] flex flex-col bg-white rounded-2xl overflow-hidden border border-[#348E87]/10 hover:shadow-xl hover:border-[#348E87]/30 transition-all duration-300"
                        >
                            { }
                            <div className="h-[50%] relative bg-[#fcfcfc] border-b border-[#348E87]/5 group-hover:bg-[#348E87]/5 transition-colors">
                                { }
                                <div className="absolute top-4 left-4 z-10 w-[90%]">
                                    <h3 className="text-lg font-bold text-[#289dbc] leading-tight group-hover:translate-x-1 transition-transform">{card.title}</h3>
                                </div>
                                {card.visual}
                            </div>

                            { }
                            <div className="h-[50%] p-6 flex flex-col justify-start">
                                <p className="text-[#289dbc] text-sm leading-relaxed font-medium">
                                    {card.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default HeroSection;
