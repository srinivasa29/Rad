import React from "react";
import { Clock } from "lucide-react";
import { fetchMarketNews } from "../../api/marketApi";

export default function NewsSentiment({ className }) {
    const [newsItems, setNewsItems] = React.useState(newsItemsFallback);

    React.useEffect(() => {
        let isMounted = true;

        const positiveTerms = ['surge', 'record', 'beat', 'growth', 'rally', 'upgrade'];
        const negativeTerms = ['drop', 'miss', 'cut', 'fall', 'downgrade', 'selloff'];

        const detectSentiment = (title = '') => {
            const normalized = String(title).toLowerCase();
            const positiveScore = positiveTerms.filter((term) => normalized.includes(term)).length;
            const negativeScore = negativeTerms.filter((term) => normalized.includes(term)).length;

            if (positiveScore > negativeScore) return 'Bullish';
            if (negativeScore > positiveScore) return 'Bearish';
            return 'Neutral';
        };

        const detectImpact = (title = '') => {
            const normalized = String(title).toLowerCase();
            if (normalized.includes('fed') || normalized.includes('inflation') || normalized.includes('rate') || normalized.includes('earnings')) {
                return 'High';
            }
            if (normalized.includes('sector') || normalized.includes('oil') || normalized.includes('crypto')) {
                return 'Medium';
            }
            return 'Low';
        };

        const loadSentimentNews = async () => {
            try {
                const response = await fetchMarketNews();
                const rows = Array.isArray(response) ? response.slice(0, 4) : [];
                const mapped = rows.map((row) => ({
                    source: row.source || 'Market Wire',
                    title: row.title,
                    time: row.publishedAt || new Date().toISOString(),
                    sentiment: detectSentiment(row.title),
                    impact: detectImpact(row.title),
                }));

                if (isMounted && mapped.length) {
                    setNewsItems(mapped);
                }
            } catch (error) {
                console.error('Failed to load news sentiment cards:', error);
                if (isMounted) {
                    setNewsItems(newsItemsFallback);
                }
            }
        };

        loadSentimentNews();
        const intervalId = setInterval(loadSentimentNews, 90000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className={className ?? "bg-[#0b1d21] rounded-3xl border border-white/10 p-6 h-full flex flex-col"}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">Market Sentiment</h3>
                <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="w-2 h-2 rounded-full bg-[#42C0A5] animate-pulse"></span>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                {newsItems.map((item, i) => (
                    <div key={i} className="group p-4 border border-white/5 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-white/40 text-xs flex items-center gap-1">
                                <Clock size={10} /> {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.source}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${item.impact === 'High' ? 'border-[#42C0A5] text-[#42C0A5]'
                                    : item.impact === 'Medium' ? 'border-yellow-400 text-yellow-400'
                                        : 'border-white/20 text-white/40'
                                }`}>
                                {item.impact} Impact
                            </span>
                        </div>

                        <h4 className="text-white font-medium text-sm leading-snug mb-3 group-hover:text-[#6FFFE9] transition-colors">
                            {item.title}
                        </h4>

                        {}
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                            <div
                                className={`h-full ${item.sentiment === 'Bullish' ? 'bg-[#42C0A5] w-3/4'
                                        : item.sentiment === 'Bearish' ? 'bg-red-400 w-3/4'
                                            : 'bg-white/40 w-1/2'
                                    }`}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-white/30">Sentiment Analysis</span>
                            <span className={`text-[10px] font-bold ${item.sentiment === 'Bullish' ? 'text-[#42C0A5]'
                                    : item.sentiment === 'Bearish' ? 'text-red-400'
                                        : 'text-white/50'
                                }`}>{item.sentiment}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const newsItemsFallback = [
    {
        source: 'Bloomberg',
        title: 'Bitcoin ETFs See Record Inflows in First Week',
        time: new Date().toISOString(),
        sentiment: 'Bullish',
        impact: 'High',
    },
    {
        source: 'Reuters',
        title: 'Oil Prices Dip on Unexpected Inventory Build',
        time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        sentiment: 'Bearish',
        impact: 'Medium',
    },
    {
        source: 'CNBC',
        title: 'Tech Earnings Preview: Big Seven Expectations',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sentiment: 'Neutral',
        impact: 'Low',
    },
];
