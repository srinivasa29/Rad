import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import './Profile.css';
import { 
    Bell, 
    MessageCircle, 
    ChevronRight, 
    Zap, 
    Activity, 
    User as UserIcon, 
    Clock, 
    CheckCircle, 
    Shield, 
    AlertCircle,
    ArrowRight,
    LayoutDashboard,
    Star,
    Filter,
    Newspaper,
    Search,
    Settings,
    LogOut
} from 'lucide-react';

const toPayload = (value, fallback = null) => {
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'data')) {
        return value.data ?? fallback;
    }
    return value ?? fallback;
};

const PageShell = ({ title, subtitle, children }) => (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h1 className="text-2xl font-black tracking-tight">{title}</h1>
                <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
                <div className="mt-4">
                    <Link to="/dashboard" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">Back to Dashboard</Link>
                </div>
            </div>
            {children}
        </div>
    </div>
);

const scheduleAsync = (fn) => {
    Promise.resolve().then(fn);
};

export function VerifyEmailPage() {
    const location = useLocation();
    const token = useMemo(() => new URLSearchParams(location.search).get('token'), [location.search]);

    return (
        <PageShell
            title="Email Verification"
            subtitle="Confirm your email address to activate all account features."
        >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm">
                    {token
                        ? 'Verification token detected. Your email verification has been acknowledged.'
                        : 'No verification token found. Please open this page using the link from your email.'}
                </p>
            </div>
        </PageShell>
    );
}

export function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        if (!email || !password) {
            setError('Email and new password are required.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/auth/reset-password', { email, password });
            setMessage('Password updated successfully. You can now log in.');
            setPassword('');
            setConfirmPassword('');
        } catch (submitError) {
            setError(submitError?.response?.data?.message || submitError?.response?.data?.error || 'Failed to reset password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageShell
            title="Reset Password"
            subtitle="Set a new password for your account."
        >
            <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                {error ? <div className="text-sm text-rose-300">{error}</div> : null}
                {message ? <div className="text-sm text-emerald-300">{message}</div> : null}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                />
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-sm"
                >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </PageShell>
    );
}

export function GlobalSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const value = query.trim();
        if (!value) {
            setResults([]);
            return undefined;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await api.get('/search', { params: { q: value } });
                const payload = toPayload(response.data, []);
                setResults(Array.isArray(payload) ? payload : []);
            } catch (_error) {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <PageShell
            title="Global Symbol Search"
            subtitle="Debounced search across stocks, crypto, and forex symbols."
        >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search symbol or company name..."
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                />
                {loading ? <div className="text-xs text-slate-400">Searching...</div> : null}
                <div className="space-y-2">
                    {results.map((row) => (
                        <div key={`${row.symbol}-${row.exchange}`} className="rounded-lg border border-white/10 p-3 text-sm">
                            <div className="font-black">{row.symbol}</div>
                            <div className="text-slate-300">{row.name}</div>
                            <div className="text-xs text-slate-400">{row.type || row.assetType} • {row.exchange}</div>
                        </div>
                    ))}
                </div>
            </div>
        </PageShell>
    );
}

export function DiscoveryPage() {
    const [bullFlags, setBullFlags] = useState([]);
    const [doubleBottoms, setDoubleBottoms] = useState([]);

    useEffect(() => {
        const load = async () => {
            const [bullRes, dblRes] = await Promise.all([
                api.get('/discovery/patterns/bull-flag').catch(() => ({ data: [] })),
                api.get('/discovery/patterns/double-bottom').catch(() => ({ data: [] })),
            ]);
            const bullPayload = toPayload(bullRes.data, []);
            const dblPayload = toPayload(dblRes.data, []);
            setBullFlags(Array.isArray(bullPayload) ? bullPayload : []);
            setDoubleBottoms(Array.isArray(dblPayload) ? dblPayload : []);
        };

        load();
    }, []);

    return (
        <PageShell
            title="Discovery"
            subtitle="Pattern highlights for Bull Flag and Double Bottom setups."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="font-black mb-3">Bull Flag</h2>
                    <ul className="space-y-2 text-sm">
                        {bullFlags.map((item) => <li key={item.symbol}>{item.symbol} - {item.name}</li>)}
                    </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="font-black mb-3">Double Bottom</h2>
                    <ul className="space-y-2 text-sm">
                        {doubleBottoms.map((item) => <li key={item.symbol}>{item.symbol} - {item.name}</li>)}
                    </ul>
                </div>
            </div>
        </PageShell>
    );
}

export function CalendarPage() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const load = async () => {
            const response = await api.get('/calendar/events').catch(() => ({ data: [] }));
            const payload = toPayload(response.data, []);
            setEvents(Array.isArray(payload) ? payload : []);
        };
        load();
    }, []);

    return (
        <PageShell
            title="Economic Calendar"
            subtitle="Timeline of upcoming macro and policy events."
        >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-400">
                            <th className="py-2 pr-4">Date</th>
                            <th className="py-2 pr-4">Country</th>
                            <th className="py-2 pr-4">Event</th>
                            <th className="py-2 pr-4">Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((item, index) => (
                            <tr key={`${item.event}-${index}`} className="border-t border-white/10">
                                <td className="py-2 pr-4">{item.date}</td>
                                <td className="py-2 pr-4">{item.country}</td>
                                <td className="py-2 pr-4">{item.event}</td>
                                <td className="py-2 pr-4">{item.impact}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageShell>
    );
}

export function NewsPage() {
    const [rows, setRows] = useState([]);
    const [activeTab, setActiveTab] = useState('live');
    const [sortBy, setSortBy] = useState('latest');
    const [selectedSource, setSelectedSource] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const load = async () => {
            const response = await api.get('/news/general').catch(() => ({ data: [] }));
            const payload = toPayload(response.data, []);
            setRows(Array.isArray(payload) ? payload : []);
        };
        load();
    }, []);

    // Filter and sort news
    const filteredNews = rows.filter(item => {
        const matchesSource = selectedSource === 'all' || item.source === selectedSource;
        const matchesSearch = searchQuery === '' || item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSource && matchesSearch;
    }).sort((a, b) => {
        if (sortBy === 'latest') {
            return new Date(b.publishedAt || b.time) - new Date(a.publishedAt || a.time);
        }
        return 0;
    });

    const uniqueSources = ['all', ...Array.from(new Set(rows.map(item => item.source)))];

    const getImpactBadge = (item) => {
        if (item.sentiment === 'positive') return { text: 'Bullish', color: 'emerald' };
        if (item.sentiment === 'negative') return { text: 'Bearish', color: 'rose' };
        return { text: 'Neutral', color: 'slate' };
    };

    return (
        <PageShell
            title="Financial News"
            subtitle="Aggregated market feed from configured news providers."
        >
            <div className="space-y-6">
                {/* Controls Section */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search news, symbols, sources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
                            />
                        </div>
                    </div>

                    {/* Tabs and Filters */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex gap-2">
                            {['live', 'top news', 'watchlist', 'my feeds'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                        activeTab === tab
                                            ? 'bg-cyan-500 text-slate-950'
                                            : 'bg-white/5 border border-white/10 text-slate-300 hover:border-white/20'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            {/* Sort Dropdown */}
                            <div>
                                <label className="text-xs text-slate-400">Sort:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="ml-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50"
                                >
                                    <option value="latest">Latest</option>
                                    <option value="trending">Trending</option>
                                    <option value="impact">Impact</option>
                                </select>
                            </div>

                            {/* Source Filter */}
                            <div>
                                <label className="text-xs text-slate-400">Source:</label>
                                <select
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                    className="ml-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50"
                                >
                                    {uniqueSources.map((source) => (
                                        <option key={source} value={source}>
                                            {source.charAt(0).toUpperCase() + source.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main News Column */}
                    <div className="lg:col-span-2 space-y-3">
                        {filteredNews.length > 0 ? (
                            filteredNews.map((item, index) => {
                                const impactBadge = getImpactBadge(item);
                                return (
                                    <article
                                        key={`${item.title}-${index}`}
                                        className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-cyan-500/30 hover:bg-white/10 transition-all p-5 cursor-pointer"
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon/Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                                                    <span className="text-lg font-black text-cyan-400">
                                                        {item.source?.charAt(0).toUpperCase() || '📰'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-black text-base leading-snug group-hover:text-cyan-300 transition-colors">
                                                            {item.title}
                                                        </h3>
                                                        <p className="text-xs text-slate-400 mt-2">
                                                            {item.source} • {item.time || item.publishedAt || '-'}
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                </div>

                                                {item.description && (
                                                    <p className="text-sm text-slate-300 mt-3 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}

                                                {/* Tags and Impact */}
                                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-${impactBadge.color}-500/20 text-${impactBadge.color}-300 border border-${impactBadge.color}-500/30`}>
                                                        {impactBadge.text}
                                                    </span>
                                                    {item.symbols && item.symbols.length > 0 && (
                                                        <div className="flex gap-1">
                                                            {item.symbols.slice(0, 3).map((symbol) => (
                                                                <span key={symbol} className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 border border-white/10 text-cyan-400">
                                                                    {symbol}
                                                                </span>
                                                            ))}
                                                            {item.symbols.length > 3 && (
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 border border-white/10 text-slate-400">
                                                                    +{item.symbols.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-slate-400 text-sm">No news found matching your criteria</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Top Stories Widget */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                            <h3 className="font-black text-sm">TOP STORIES</h3>
                            <div className="space-y-3">
                                {rows.slice(0, 5).map((item, index) => (
                                    <div key={`top-${index}`} className="pb-3 border-b border-white/10 last:pb-0 last:border-0">
                                        <p className="text-xs font-bold text-cyan-400 mb-1">{index + 1}</p>
                                        <p className="text-xs line-clamp-2 leading-snug text-slate-200 font-semibold">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">{item.source}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sources Widget */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                            <h3 className="font-black text-sm">SOURCES</h3>
                            <div className="space-y-2">
                                {uniqueSources.slice(1, 6).map((source) => {
                                    const count = rows.filter(item => item.source === source).length;
                                    return (
                                        <div
                                            key={source}
                                            onClick={() => setSelectedSource(source)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/30 hover:bg-slate-900/60 cursor-pointer transition-colors"
                                        >
                                            <span className="text-xs font-semibold text-slate-300">{source}</span>
                                            <span className="text-xs font-bold text-cyan-400">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

export function WatchlistsPage() {
    return <AdvancedWatchlistDashboard />;
}

export function PortfolioPage() {
    const [portfolio, setPortfolio] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [form, setForm] = useState({ symbol: '', side: 'BUY', quantity: '', price: '' });

    const load = async () => {
        const [portfolioRes, analyticsRes] = await Promise.all([
            api.get('/user/portfolio').catch(() => ({ data: null })),
            api.get('/user/portfolio/analytics').catch(() => ({ data: null })),
        ]);
        setPortfolio(toPayload(portfolioRes.data, null));
        setAnalytics(toPayload(analyticsRes.data, null));
    };

    useEffect(() => {
        scheduleAsync(load);
    }, []);

    const submitTrade = async (event) => {
        event.preventDefault();
        await api.post('/user/portfolio/transactions', {
            symbol: form.symbol,
            side: form.side,
            quantity: Number(form.quantity),
            price: Number(form.price),
            assetType: 'STOCK',
        }).catch(() => null);
        setForm({ symbol: '', side: 'BUY', quantity: '', price: '' });
        load();
    };

    const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];

    return (
        <PageShell
            title="Portfolio"
            subtitle="Holdings and portfolio analytics."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs text-slate-400">Total Value</div>
                    <div className="text-xl font-black mt-1">{analytics?.totalValue ?? '-'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs text-slate-400">Cash</div>
                    <div className="text-xl font-black mt-1">{analytics?.cashBalance ?? '-'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs text-slate-400">Holdings</div>
                    <div className="text-xl font-black mt-1">{analytics?.holdingsCount ?? holdings.length}</div>
                </div>
            </div>

            <form onSubmit={submitTrade} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
                <h2 className="font-black">Add Transaction</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input value={form.symbol} onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))} placeholder="Symbol" className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
                    <select value={form.side} onChange={(event) => setForm((prev) => ({ ...prev, side: event.target.value }))} className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                    <input value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="Quantity" className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
                    <input value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="Price" className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-sm">Submit</button>
            </form>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-400">
                            <th className="py-2 pr-4">Symbol</th>
                            <th className="py-2 pr-4">Quantity</th>
                            <th className="py-2 pr-4">Avg Price</th>
                            <th className="py-2 pr-4">Current Price</th>
                            <th className="py-2 pr-4">PnL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map((row) => (
                            <tr key={row.symbol} className="border-t border-white/10">
                                <td className="py-2 pr-4">{row.symbol}</td>
                                <td className="py-2 pr-4">{row.quantity}</td>
                                <td className="py-2 pr-4">{row.avgBuyPrice}</td>
                                <td className="py-2 pr-4">{row.currentPrice}</td>
                                <td className="py-2 pr-4">{row.unrealizedPnL}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageShell>
    );
}

export function AlertsPage() {
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [history, setHistory] = useState([]);
    const [form, setForm] = useState({ symbol: '', type: 'TRADER', condition: 'PRICE_ABOVE', threshold: '' });

    const load = async () => {
        const [activeRes, historyRes] = await Promise.all([
            api.get('/alerts').catch(() => ({ data: [] })),
            api.get('/alerts/history').catch(() => ({ data: [] })),
        ]);
        setActiveAlerts(Array.isArray(toPayload(activeRes.data, [])) ? toPayload(activeRes.data, []) : []);
        setHistory(Array.isArray(toPayload(historyRes.data, [])) ? toPayload(historyRes.data, []) : []);
    };

    useEffect(() => {
        scheduleAsync(load);
    }, []);

    const createAlert = async (event) => {
        event.preventDefault();
        await api.post('/alerts', {
            symbol: form.symbol,
            type: form.type,
            condition: form.condition,
            threshold: Number(form.threshold),
        }).catch(() => null);
        setForm({ symbol: '', type: 'TRADER', condition: 'PRICE_ABOVE', threshold: '' });
        load();
    };

    const deleteAlert = async (id) => {
        await api.delete(`/alerts/${id}`).catch(() => null);
        load();
    };

    return (
        <PageShell
            title="Alerts"
            subtitle="Configure and monitor price/indicator alerts."
        >
            <form onSubmit={createAlert} className="rounded-2xl border border-white/10 bg-white/5 p-6 grid grid-cols-1 md:grid-cols-4 gap-2">
                <input value={form.symbol} onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))} placeholder="Symbol" className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
                <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))} className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
                    <option value="TRADER">TRADER</option>
                    <option value="INVESTOR">INVESTOR</option>
                </select>
                <select value={form.condition} onChange={(event) => setForm((prev) => ({ ...prev, condition: event.target.value }))} className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
                    <option value="PRICE_ABOVE">PRICE_ABOVE</option>
                    <option value="PRICE_BELOW">PRICE_BELOW</option>
                    <option value="RSI_ABOVE">RSI_ABOVE</option>
                    <option value="RSI_BELOW">RSI_BELOW</option>
                    <option value="PE_ABOVE">PE_ABOVE</option>
                    <option value="PE_BELOW">PE_BELOW</option>
                </select>
                <input value={form.threshold} onChange={(event) => setForm((prev) => ({ ...prev, threshold: event.target.value }))} placeholder="Threshold" className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
                <button type="submit" className="md:col-span-4 rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-sm">Create Alert</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="font-black mb-3">Active Alerts</h2>
                    <div className="space-y-2 text-sm">
                        {activeAlerts.map((row) => (
                            <div key={row._id} className="border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                                <div>{row.symbol} • {row.condition} • {row.threshold}</div>
                                <button onClick={() => deleteAlert(row._id)} className="text-rose-300 text-xs font-bold">Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="font-black mb-3">Triggered History</h2>
                    <div className="space-y-2 text-sm">
                        {history.map((row) => (
                            <div key={row._id} className="border border-white/10 rounded-lg px-3 py-2">
                                {row.symbol} • {row.status}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

export function ReportsExportPage() {
    const [status, setStatus] = useState('');

    const download = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const exportCsv = async () => {
        const response = await api.get('/reports/csv');
        const payload = response.data;
        const body = payload?.data || '';
        download(String(body), 'portfolio-report.csv', 'text/csv');
        setStatus('CSV report exported.');
    };

    const exportPdf = async () => {
        const response = await api.get('/reports/pdf');
        download(JSON.stringify(response.data, null, 2), 'portfolio-report.pdf.json', 'application/json');
        setStatus('PDF export payload downloaded.');
    };

    return (
        <PageShell
            title="Reports Export"
            subtitle="Generate PDF/CSV portfolio reports."
        >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="flex gap-3">
                    <button onClick={exportPdf} className="rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-sm">Export PDF</button>
                    <button onClick={exportCsv} className="rounded-lg bg-emerald-400 text-slate-950 px-4 py-2 font-bold text-sm">Export CSV</button>
                </div>
                {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
            </div>
        </PageShell>
    );
}

export function ProfilePage() {
    const [profile, setProfile] = useState({ 
        username: 'Krishna', 
        email: 'krishna@email.com',
        joinedDate: 'Joined Feb 2024'
    });
    
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const navigate = useNavigate();

    // Alignment Metrics
    const investorPercent = 40;
    const traderPercent = 60;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initial = profile.username.charAt(0).toUpperCase();

    return (
        <div className="profile-page-root">
            <header className="navbar profile-custom-navbar rounded-xl mx-auto max-w-[1400px] border border-blue-100 shadow-sm relative z-[110] bg-white flex items-center justify-between px-12 py-3">
                <div className="flex items-center gap-4 shrink-0">
                    <img
                        src="/radar-logo-final.jpg"
                        alt="Radar Logo"
                        className="w-10 h-10 rounded-full object-cover border border-blue-100/50 shadow-sm"
                    />
                    <span className="brand-name font-black tracking-tighter text-2xl" style={{ color: '#3E84F6' }}>RADAR</span>
                </div>

                <div className="hidden lg:flex items-center gap-10 ml-12">
                    {[
                        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
                        { id: 'WATCHLIST', label: 'Watchlist', icon: Star, to: '/dashboard?module=watchlist' },
                        { id: 'SCREENERS', label: 'Screeners', icon: Filter, to: '/dashboard?module=screeners' },
                        { id: 'NEWS', label: 'News', icon: Newspaper, to: '/dashboard?module=news' }
                    ].map((item) => (
                        <Link
                            key={item.id}
                            to={item.to}
                            className="flex items-center gap-2.5 text-sm font-extrabold tracking-tight transition-all duration-300 hover:scale-105"
                            style={{ color: '#3E84F6' }}
                        >
                            <item.icon size={18} strokeWidth={2.5} />
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-8 ml-auto">
                    <div className="hidden md:flex relative w-72 h-10">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search stocks..."
                            className="w-full h-full rounded-2xl pl-12 pr-4 text-xs font-semibold focus:outline-none bg-white border border-blue-50 text-blue-900 placeholder:text-blue-200 shadow-none hover:border-blue-100"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-[#3E84F6] cursor-pointer hover:scale-110 transition-transform">
                            <Bell size={22} strokeWidth={2} />
                        </div>
                        <div className="relative" ref={profileRef}>
                            <div 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3E84F6] shadow-[0_4px_12px_rgba(62,132,246,0.3)] text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
                            >
                                {initial}
                            </div>

                            {/* Profile Dropdown Content */}
                            {isProfileOpen && (
                                <div className="absolute right-0 top-14 w-72 rounded-xl shadow-2xl border py-2 backdrop-blur-xl z-[200] origin-top-right bg-white border-blue-100/50">
                                    <div className="px-4 py-4 border-b border-blue-50 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-bold text-white">
                                            {initial}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{profile.username}</p>
                                            <p className="text-xs text-slate-500">{profile.email}</p>
                                        </div>
                                    </div>
                                    <div className="py-2">
                                        <Link 
                                            to="/profile" 
                                            onClick={() => setIsProfileOpen(false)} 
                                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-slate-700 hover:bg-blue-50/50 transition-colors"
                                        >
                                            <UserIcon size={16} /> My Profile
                                        </Link>
                                        <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-slate-700 hover:bg-blue-50/50 transition-colors">
                                            <Settings size={16} /> Settings
                                        </button>
                                        <button 
                                            onClick={() => navigate('/')}
                                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-rose-500 hover:bg-rose-50/50 transition-colors"
                                        >
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Header */}
            <div className="profile-header-bg">
                <h1 className="profile-title-text">My Profile</h1>
            </div>

            {/* Main Content Area */}
            <main className="profile-main-container">
                <div className="glass-card">
                    {/* Top Section: Overview & Market Behavior */}
                    <div className="profile-top-row">
                        <div className="overview-col">
                            <div className="profile-avatar-big">{initial}</div>
                            <div className="overview-info">
                                <h2>{profile.username}</h2>
                                <p className="user-email">{profile.email}</p>
                                <div className="joined-meta">
                                    <Clock size={14} /> {profile.joinedDate}
                                </div>
                                <div className="mode-pill">
                                    <Zap size={12} fill="#2563eb" /> Trader Mode
                                </div>
                                <div className="archetype-title">
                                    <Zap size={14} className="text-yellow-500" fill="currentColor" /> 
                                    The Predator — Advanced Trader Archetype
                                </div>
                            </div>
                        </div>

                        <div className="market-behavior-top">
                            <div className="card-heading">Market Behavior Alignment</div>
                            <div className="behavior-bars-grid">
                                <div className="behavior-bar-item">
                                    <div className="bar-label-wrap">
                                        <span>INVESTOR</span>
                                        <span>{investorPercent}%</span>
                                    </div>
                                    <div className="bar-track">
                                        <div className="bar-fill investor" style={{ width: `${investorPercent}%` }} />
                                    </div>
                                </div>
                                <div className="behavior-bar-item">
                                    <div className="bar-label-wrap">
                                        <span>TRADER</span>
                                        <span>{traderPercent}%</span>
                                    </div>
                                    <div className="bar-track">
                                        <div className="bar-fill trader" style={{ width: `${traderPercent}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="behavior-meta-actions">
                                <span className="last-assessed">Last assessed: Feb 20</span>
                                <button className="btn-retake">Retake Assessment</button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: 3-Column Grid */}
                    <div className="profile-bottom-grid">
                        
                        {/* Col 1: Market Behavior Mini */}
                        <div className="stat-card">
                            <div className="card-heading">Market Behavior</div>
                            <div className="behavior-bars-grid !mb-4">
                                <div className="behavior-bar-item !gap-1">
                                    <div className="bar-label-wrap !text-[10px]">
                                        <span>INV</span>
                                        <span>40%</span>
                                    </div>
                                    <div className="bar-track !h-[4px]">
                                        <div className="bar-fill investor" style={{ width: '40%' }} />
                                    </div>
                                </div>
                                <div className="behavior-bar-item !gap-1">
                                    <div className="bar-label-wrap !text-[10px]">
                                        <span>TRA</span>
                                        <span>60%</span>
                                    </div>
                                    <div className="bar-track !h-[4px]">
                                        <div className="bar-fill trader" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            </div>
                            <div className="card-cta">Go to Behavior Assessment <ArrowRight size={14} /></div>
                        </div>

                        {/* Col 2: Activity Snapshot */}
                        <div className="stat-card">
                            <div className="card-heading">Activity Snapshot</div>
                            <div className="mini-stats-grid">
                                <div className="mini-stat">
                                    <span className="num">6</span>
                                    <span className="label">Stocks</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="num">14</span>
                                    <span className="label">Screeners Run</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="num">3</span>
                                    <span className="label">Alerts</span>
                                </div>
                            </div>
                            <div className="ticker-wrap">
                                <span className="ticker-item">RELIANCE</span>
                                <span className="ticker-item">INFY</span>
                                <span className="ticker-item">TATAMOTORS</span>
                            </div>
                            <div className="card-cta">Change Mode <ArrowRight size={14} /></div>
                        </div>

                        {/* Col 3: Preferences */}
                        <div className="stat-card">
                            <div className="card-heading">Preferences</div>
                            <div className="pref-list">
                                <div className="pref-item">
                                    <span className="pref-label">Preferred Sectors</span>
                                    <span className="pref-val">Technology, Finance</span>
                                </div>
                                <div className="pref-item">
                                    <span className="pref-label">Risk Level</span>
                                    <span className="pref-val risk-high">
                                        <AlertCircle size={14} /> High
                                    </span>
                                </div>
                                <div className="pref-item">
                                    <span className="pref-label">Investment Style</span>
                                    <span className="pref-val">Momentum / Technical</span>
                                </div>
                            </div>
                            <div className="card-cta">Edit Preferences <ArrowRight size={14} /></div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

export function SettingsPage() {
    const [theme, setTheme] = useState('dark');
    const [persona, setPersona] = useState('INVESTOR');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const load = async () => {
            const response = await api.get('/auth/me').catch(() => ({ data: {} }));
            const me = toPayload(response.data, {});
            setPersona(me?.preferredMode || 'INVESTOR');
            setTheme(me?.settings?.theme || 'dark');
        };
        load();
    }, []);

    const save = async (event) => {
        event.preventDefault();
        await Promise.all([
            api.put('/user/persona', { persona }).catch(() => null),
            api.put('/user/settings', { theme }).catch(() => null),
        ]);
        localStorage.setItem('mode', persona === 'TRADER' ? 'TRADER' : 'INVESTOR');
        setStatus('Settings updated.');
    };

    return (
        <PageShell
            title="Settings"
            subtitle="Persona and UI preference controls."
        >
            <form onSubmit={save} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
                <label className="block text-sm">
                    <span className="text-slate-300">Persona</span>
                    <select value={persona} onChange={(event) => setPersona(event.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
                        <option value="TRADER">TRADER</option>
                        <option value="INVESTOR">INVESTOR</option>
                    </select>
                </label>
                <label className="block text-sm">
                    <span className="text-slate-300">Theme</span>
                    <select value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
                        <option value="dark">dark</option>
                        <option value="light">light</option>
                    </select>
                </label>
                <button type="submit" className="rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-sm">Save Settings</button>
                {status ? <div className="text-sm text-emerald-300">{status}</div> : null}
            </form>
        </PageShell>
    );
}

export function InvestorFilingsPage() {
    const [symbol, setSymbol] = useState('AAPL');
    const [rows, setRows] = useState([]);

    const fetchFilings = async () => {
        const target = symbol.trim().toUpperCase();
        if (!target) return;
        const response = await api.get(`/fundamental/${encodeURIComponent(target)}/filings`).catch(() => ({ data: [] }));
        const payload = toPayload(response.data, []);
        setRows(Array.isArray(payload) ? payload : []);
    };

    useEffect(() => {
        scheduleAsync(fetchFilings);
    }, []);

    return (
        <PageShell
            title="Investor Filings"
            subtitle="SEC EDGAR filings table for the selected symbol."
        >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="flex gap-2">
                    <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Symbol (e.g. AAPL)" className="flex-1 rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
                    <button onClick={fetchFilings} className="rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-sm">Load</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-400">
                                <th className="py-2 pr-4">Form</th>
                                <th className="py-2 pr-4">Filing Date</th>
                                <th className="py-2 pr-4">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`${row.accessionNumber || row.form}-${index}`} className="border-t border-white/10">
                                    <td className="py-2 pr-4">{row.form}</td>
                                    <td className="py-2 pr-4">{row.filingDate}</td>
                                    <td className="py-2 pr-4">{row.description || row.primaryDocument}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageShell>
    );
}
