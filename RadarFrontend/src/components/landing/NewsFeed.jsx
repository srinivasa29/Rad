import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { fetchMarketNews } from '../../api/marketApi';

const fallbackNewsItems = [
    {
        source: 'Bloomberg',
        title: 'Bitcoin ETFs See Record Inflows in First Week of Trading',
        publishedAt: new Date().toISOString(),
        tag: 'Crypto',
    },
    {
        source: 'Reuters',
        title: 'Oil Prices Dip on Unexpected Inventory Build',
        publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        tag: 'Commodities',
    },
];

const formatRelativeTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Now';
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
};

const inferTag = (title = '') => {
    const normalized = String(title).toLowerCase();
    if (normalized.includes('crypto') || normalized.includes('bitcoin') || normalized.includes('ethereum')) return 'Crypto';
    if (normalized.includes('fed') || normalized.includes('inflation') || normalized.includes('rate')) return 'Macro';
    if (normalized.includes('earnings') || normalized.includes('guidance')) return 'Earnings';
    if (normalized.includes('oil') || normalized.includes('gold')) return 'Commodities';
    return 'Markets';
};

export default function NewsFeed() {
    const [newsItems, setNewsItems] = useState(fallbackNewsItems);

    useEffect(() => {
        let isMounted = true;

        const loadNews = async () => {
            try {
                const response = await fetchMarketNews();
                const items = Array.isArray(response) ? response.slice(0, 6) : [];
                if (isMounted && items.length) {
                    setNewsItems(items);
                }
            } catch (error) {
                console.error('Failed to load landing news feed:', error);
                if (isMounted) {
                    setNewsItems(fallbackNewsItems);
                }
            }
        };

        loadNews();
        const intervalId = setInterval(loadNews, 60000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden w-full h-full">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-white">Latest News</h3>
            </div>

            <div className="flex flex-col">
                {newsItems.map((item, i) => (
                    <div key={i} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[#42C0A5] text-xs font-bold uppercase tracking-wider">{item.source || 'Market Wire'}</span>
                            <span className="text-[#B9F3EA]/40 text-xs flex items-center gap-1">
                                <Clock size={10} /> {formatRelativeTime(item.publishedAt)}
                            </span>
                        </div>
                        <h4 className="text-white font-medium text-sm leading-snug group-hover:text-[#6FFFE9] transition-colors">
                            {item.title}
                        </h4>
                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                            {item.tag || inferTag(item.title)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
