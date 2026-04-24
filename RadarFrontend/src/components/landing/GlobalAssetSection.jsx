import React from 'react';
import RealtimeIcon from './RealtimeIcon';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import SplitScreenSection from './SplitScreenSection';
import { fetchMarketData } from '../../api/marketApi';

const formatSignedPercent = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0.00%';
    return `${numeric > 0 ? '+' : ''}${numeric.toFixed(2)}%`;
};

const findBySymbolHint = (rows, hints = []) => {
    const normalizedHints = hints.map((hint) => String(hint || '').toLowerCase());
    return rows.find((row) => {
        const symbol = String(row?.symbol || '').toLowerCase();
        const name = String(row?.name || '').toLowerCase();
        return normalizedHints.some((hint) => symbol.includes(hint) || name.includes(hint));
    });
};

const VisualComponent = ({ activeAsset, setActiveAsset, orbits }) => {
    return (
        <div className="relative w-[340px] h-[340px] lg:w-[480px] lg:h-[480px] flex items-center justify-center">

            { }
            <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full" />

            { }
            <div className="absolute inset-0 border border-[#6FFFE9]/20 rounded-full bg-cyan-950/30 backdrop-blur-sm z-0 overflow-hidden">
                { }
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(#6FFFE9 1px, transparent 1px), linear-gradient(90deg, #6FFFE9 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
                { }
                <motion.div
                    className="absolute inset-0 origin-bottom-right bg-gradient-to-tl from-transparent via-[#6FFFE9]/10 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
            </div>

            { }
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400">
                <defs>
                    <mask id="cutout">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx="200" cy="200" r="60" fill="black" />
                    </mask>
                </defs>

                { }
                <path d="M 40 40 L 80 40 L 80 50" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M 40 40 L 40 80 L 50 80" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M 360 40 L 320 40 L 320 50" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M 360 40 L 360 80 L 350 80" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M 40 360 L 80 360 L 80 350" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M 40 360 L 40 320 L 50 320" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M 360 360 L 320 360 L 320 350" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M 360 360 L 360 320 L 350 320" fill="none" stroke="#6FFFE9" strokeWidth="2" strokeOpacity="0.5" />

                { }
                <motion.g animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} style={{ originX: "200px", originY: "200px" }}>
                    <circle cx="200" cy="200" r="190" stroke="#6FFFE9" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="10 10" fill="none" />
                    <path d="M 200 10 L 200 30" stroke="#6FFFE9" strokeWidth="2" />
                    <path d="M 200 390 L 200 370" stroke="#6FFFE9" strokeWidth="2" />
                    <path d="M 10 200 L 30 200" stroke="#6FFFE9" strokeWidth="2" />
                    <path d="M 390 200 L 370 200" stroke="#6FFFE9" strokeWidth="2" />
                </motion.g>

                <motion.g animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} style={{ originX: "200px", originY: "200px" }}>
                    <circle cx="200" cy="200" r="160" stroke="#C084FC" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="4 4" fill="none" />
                    <circle cx="200" cy="200" r="130" stroke="#6FFFE9" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
                </motion.g>
            </svg>

            { }
            <div className="absolute top-4 left-4 z-20 font-mono text-[10px] text-[#6FFFE9]/70 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#6FFFE9] animate-pulse" />
                    <span>LIVE_FEED</span>
                </div>
                <span>SIGNAL: 98%</span>
            </div>

            <div className="absolute top-4 right-4 z-20 font-mono text-[10px] text-[#C084FC]/70 text-right">
                <div className="flex items-center justify-end gap-1">
                    <span>LATENCY</span>
                    <Activity size={10} />
                </div>
                <span>12ms</span>
            </div>

            <div className="absolute bottom-4 left-4 z-20 font-mono text-[10px] text-[#6FFFE9]/50">
                <div>x: 482.11</div>
                <div>y: 102.44</div>
            </div>

            <div className="absolute bottom-4 right-4 z-20 font-mono text-[10px] text-[#6FFFE9]/50 text-right">
                <div>SYS: NOMINAL</div>
                <div>ENC: AES-256</div>
            </div>

            { }
            <div
                onClick={() => window.location.href = '/'}
                className="relative z-30 w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,112,107,0.6)] overflow-hidden border-4 border-[#6FFFE9]/20 bg-black cursor-pointer hover:scale-105 transition-transform duration-300 group"
            >
                <motion.img
                    src="/radar-logo-final.jpg"
                    alt="Radar Core"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                { }
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 border-[1px] border-[#6FFFE9]/30 rounded-full scale-90"></div>
            </div>

            { }
            <div className="absolute inset-0 bg-[#6FFFE9]/5 blur-3xl rounded-full pointer-events-none" />

            { }
            {orbits.map((orbit, idx) => (
                <motion.div
                    key={idx}
                    className="absolute rounded-full border border-white/5 pointer-events-none"
                    style={{
                        width: orbit.radius * 2,
                        height: orbit.radius * 2,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: orbit.speed, repeat: Infinity, ease: "linear" }}
                >
                    { }
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveAsset(activeAsset === orbit.label ? null : orbit.label);
                        }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#020617] border border-[#6FFFE9]/30 rounded-full flex items-center justify-center text-lg font-bold shadow-lg z-40 cursor-pointer pointer-events-auto hover:border-[#6FFFE9] hover:bg-slate-900 transition-colors"
                        style={{ color: orbit.color }}
                    >
                        {orbit.icon}

                        { }
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: activeAsset === orbit.label ? 1 : 0,
                                scale: activeAsset === orbit.label ? 1 : 0.8,
                                rotate: -360
                            }}
                            transition={{ duration: 0.2 }}
                            className={`absolute bottom-full mb-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 pointer-events-none ${activeAsset === orbit.label ? 'block' : 'hidden'}`}
                        >
                            <div className="text-gray-400 font-medium">{orbit.label}</div>
                            <div className="text-white font-bold flex gap-2">
                                {orbit.value}
                                <span className={orbit.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{orbit.trend}</span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            ))}

        </div>
    );
};

const GlobalAssetSection = () => {

    const features = [
        {
            title: "Adaptive by Design",
            text: "Radar adapts to how you invest or trade. The experience changes based on context — without you needing to configure it.",
            icon: "/assets/icon1.jpg"
        },
        {
            title: "Unified Markets",
            text: "Stocks, crypto, forex, and more — understood together. Radar gives you a single, connected view of global markets.",
            icon: "/assets/icon2.jpg"
        },
        {
            title: "Signal over Noise",
            text: "Radar filters market complexity into clear, meaningful signals. You see what matters — not everything that moves.",
            icon: "/assets/icon3.jpg"
        },
        {
            title: "Always On",
            text: "Markets don’t pause — neither does Radar. Continuous monitoring ensures you never miss important shifts.",
            icon: RealtimeIcon
        }
    ];

    const [activeAsset, setActiveAsset] = React.useState(null);
    const [orbits, setOrbits] = React.useState([
        { radius: 100, speed: 10, icon: "₿", color: "#F7931A", label: "Bitcoin", value: "Loading...", trend: "..." },
        { radius: 150, speed: 15, icon: "$", color: "#4ADE80", label: "USD Index", value: "Loading...", trend: "..." },
        { radius: 190, speed: 20, icon: "€", color: "#60A5FA", label: "EUR/USD", value: "Loading...", trend: "..." },
        { radius: 230, speed: 25, icon: "£", color: "#C084FC", label: "GBP/USD", value: "Loading...", trend: "..." },
    ]);

    React.useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const rows = await fetchMarketData();
                const marketRows = Array.isArray(rows) ? rows : [];

                const btc = findBySymbolHint(marketRows, ['btc']);
                const usdIndex = findBySymbolHint(marketRows, ['dxy', 'usd']);
                const eurUsd = findBySymbolHint(marketRows, ['eurusd', 'eur/usd', 'eur']);
                const gbpUsd = findBySymbolHint(marketRows, ['gbpusd', 'gbp/usd', 'gbp']);

                if (!isMounted) {
                    return;
                }

                setOrbits(prev => [
                    {
                        ...prev[0],
                        value: Number(btc?.price || 83915).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                        trend: formatSignedPercent(btc?.change_24h),
                    },
                    {
                        ...prev[1],
                        value: Number(usdIndex?.price || 103.45).toFixed(2),
                        trend: formatSignedPercent(usdIndex?.change_24h),
                    },
                    {
                        ...prev[2],
                        value: Number(eurUsd?.price || 1.0842).toFixed(4),
                        trend: formatSignedPercent(eurUsd?.change_24h),
                    },
                    {
                        ...prev[3],
                        value: Number(gbpUsd?.price || 1.2750).toFixed(4),
                        trend: formatSignedPercent(gbpUsd?.change_24h),
                    },
                ]);

            } catch (err) {
                console.error("Failed to fetch market data", err);

                if (isMounted) {
                    setOrbits(prev => [
                        { ...prev[0], value: "$83,915", trend: "+0.99%" },
                        { ...prev[1], value: "103.45", trend: "-0.10%" },
                        { ...prev[2], value: "1.0842", trend: "+0.20%" },
                        { ...prev[3], value: "1.2750", trend: "+0.10%" },
                    ]);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <SplitScreenSection
            id="global-assets"
            title="What Makes Radar Different"
            description="Radar isn’t just another platform showing raw market data. It’s built to continuously observe, filter, and adapt — so you focus on decisions, not distractions."
            titleClassName="!animate-none"
            features={features}
            imageComp={<VisualComponent activeAsset={activeAsset} setActiveAsset={setActiveAsset} orbits={orbits} />}
            reverse={true}
            gridLayout={true}
        />
    );
};

export default GlobalAssetSection;
