import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, Hash, UserRound, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchCourses, fetchProgress, getProgressKey } from '../../api/learningApi';
import { fetchUserProfile } from '../../api/userApi';
import { fetchWatchlistLiveData } from '../../api/watchlistApi';
import api from '../../api/api';
import './TraderProfilePage.css';

// Keep in sync with LearningAcademy.jsx — bump when course IDs change
const ACADEMY_SCHEMA_VERSION = 'v3_2025_05';
const migrateAcademyStorage = () => {
  const stored = localStorage.getItem('radar_academy_schema_version');
  if (stored !== ACADEMY_SCHEMA_VERSION) {
    Object.keys(localStorage)
      .filter(k => k.startsWith('radar_academy_progress_'))
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem('radar_academy_schema_version', ACADEMY_SCHEMA_VERSION);
  }
};

const unwrap = (value, fallback) => value?.data?.data ?? value?.data ?? value ?? fallback;

const formatJoined = (createdAt) => {
  if (!createdAt) return 'N/A';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};


const TraderProfilePage = ({ embedded = false } = {}) => {
  // Clear stale academy progress if schema has changed
  migrateAcademyStorage();

  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistAll, setWatchlistAll] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [breakoutAlerts, setBreakoutAlerts] = useState([]);
  const [indicatorSignals, setIndicatorSignals] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState('');

  const initial = useMemo(() => {
    const source = profile?.username || profile?.email || 'R';
    return source.trim().charAt(0).toUpperCase() || 'R';
  }, [profile]);

  const loadProfile = async () => {
    setLoading(true);
    setAnalyticsLoading(true);
    setError('');
    try {
      const [profileRes, watchlistRes, courseRes, scanRes, breakoutRes, signalsRes] = await Promise.all([
        fetchUserProfile(),
        fetchWatchlistLiveData('trader').catch(() => []),
        fetchCourses('trader').catch(() => []),
        api.get('/research/watchlist-scans').catch(() => ({ data: [] })),
        api.get('/technical/alerts').catch(() => ({ data: [] })),
        api.get('/technical/signals').catch(() => ({ data: [] })),
      ]);

      const profileData = unwrap(profileRes, {});
      setProfile(profileData);

      const watchlistRows = Array.isArray(watchlistRes) ? watchlistRes : [];
      setWatchlist(watchlistRows.slice(0, 5));
      setWatchlistAll(watchlistRows);

      const scanPayload = unwrap(scanRes, {});
      const scanRows = Array.isArray(scanPayload?.results)
        ? scanPayload.results
        : Array.isArray(scanPayload)
          ? scanPayload
          : [];
      setScanResults(scanRows);

      const breakoutPayload = unwrap(breakoutRes, []);
      setBreakoutAlerts(Array.isArray(breakoutPayload) ? breakoutPayload : []);

      const signalsPayload = unwrap(signalsRes, []);
      setIndicatorSignals(Array.isArray(signalsPayload) ? signalsPayload : []);

      // Sync backend progress to localStorage
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          const backendProgress = await fetchProgress(userId);
          const currentMode = String(localStorage.getItem('mode')).toLowerCase() === 'investor' ? 'investor' : 'trader';
          Object.entries(backendProgress).forEach(([courseId, data]) => {
            const key = getProgressKey(courseId, currentMode);
            const localData = JSON.parse(localStorage.getItem(key) || '{}');
            const merged = {
              ...localData,
              ...data,
              chapters: {
                ...(localData.chapters || {}),
                ...(data.chapters || {})
              },
              quizScores: {
                ...(localData.quizScores || {}),
                ...(data.quizScores || {})
              }
            };
            localStorage.setItem(key, JSON.stringify(merged));
          });
        }
      } catch (e) {
        console.error('Failed to sync progress from backend:', e);
      }

      setCourses(Array.isArray(courseRes) ? courseRes : []);

      if (watchlistRows.length > 0) {
        const symbols = watchlistRows
          .map((row) => String(row.symbol || '').trim())
          .filter(Boolean)
          .slice(0, 18);

        const summaryEntries = await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const resp = await api.get(`/technical/summary/stock/${encodeURIComponent(symbol)}`);
              const payload = unwrap(resp, null);
              return [symbol, payload];
            } catch (err) {
              return [symbol, null];
            }
          })
        );

        setSummaries(Object.fromEntries(summaryEntries));
      } else {
        setSummaries({});
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    const handleProfileUpdated = (event) => {
      if (event.detail) {
        setProfile(event.detail);
      }
    };
    window.addEventListener('radar:profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('radar:profile-updated', handleProfileUpdated);
    };
  }, []);

  const getCourseProgress = (course) => {
    const courseId = course.id || course._id;
    const currentMode = String(localStorage.getItem('mode')).toLowerCase() === 'investor' ? 'investor' : 'trader';
    const key = getProgressKey(courseId, currentMode);
    try {
      const progress = JSON.parse(localStorage.getItem(key) || '{}');
      const completed = course.chapters ? course.chapters.filter(ch => progress?.chapters?.[ch.id] === true).length : 0;
      const total = course.chapters?.length || 0;
      const pct = total ? Math.round((completed / total) * 100) : 0;
      return { pct, completed, total };
    } catch (e) {
      return { pct: 0, completed: 0, total: 0 };
    }
  };

  const courseFallbacks = courses.length > 0 ? courses : [
    { id: 'technical-analysis', title: 'Technical Analysis Mastery', description: 'Master chart patterns, candlesticks, and indicators.' },
    { id: 'options-derivatives', title: 'Options & Derivatives Basics', description: 'Deep dive into greeks, spreads, and volatility.' },
  ];

  const overallPct = useMemo(() => {
    const activeCourses = courses.length > 0 ? courses : [];
    if (!activeCourses.length) return { overallPct: 0, totalXP: 0, skillLevel: 'Novice', completedCoursesCount: 0, learningStreak: 1 };
    
    let totalXP = 0;
    let completedCoursesCount = 0;
    
    activeCourses.forEach(c => {
      const courseId = c.id || c._id;
      const currentMode = String(localStorage.getItem('mode')).toLowerCase() === 'investor' ? 'investor' : 'trader';
      const key = getProgressKey(courseId, currentMode);
      try {
        const progress = JSON.parse(localStorage.getItem(key) || '{}');
        const total = c.chapters?.length || 0;
        const completed = c.chapters ? c.chapters.filter(ch => progress?.chapters?.[ch.id] === true).length : 0;
        
        if (total > 0 && completed === total) {
          completedCoursesCount++;
        }
        
        if (total > 0) {
          const xpPerChapter = (c.xpReward || 150) / total;
          totalXP += Math.round(completed * xpPerChapter);
        }
      } catch (e) {}
    });
    
    const overallPctVal = Math.round((completedCoursesCount / activeCourses.length) * 100);
    const skillLevel = totalXP < 300 ? 'Novice' : totalXP < 700 ? 'Developing Trader' : totalXP < 1200 ? 'Momentum Trader' : totalXP < 1600 ? 'Professional Trader' : 'Elite Trader';
    const learningStreak = Math.max(1, Math.floor(totalXP / 100));
    
    return { overallPct: overallPctVal, totalXP, skillLevel, completedCoursesCount, learningStreak };
  }, [courses]);

  const analytics = useMemo(() => {
    const tracked = watchlistAll.length;
    const sectorMap = {};
    watchlistAll.forEach((row) => {
      const sector = String(row.sector || row.industry || row.category || 'Unclassified');
      sectorMap[sector] = (sectorMap[sector] || 0) + 1;
    });
    const sectorEntries = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]);
    const favoriteSector = sectorEntries.length ? sectorEntries[0][0] : 'N/A';

    const breakoutCount = breakoutAlerts.length;
    const totalScans = scanResults.length;
    const lastScanTime = scanResults.reduce((latest, row) => {
      const ts = row?.timestamp || row?.time || null;
      if (!ts) return latest;
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) return latest;
      return !latest || date > latest ? date : latest;
    }, null);

    const mostResearched = scanResults.reduce((best, row) => {
      const signalCount = Array.isArray(row?.signals) ? row.signals.length : 0;
      if (!best || signalCount > best.count) {
        return { symbol: row?.symbol || '', count: signalCount };
      }
      return best;
    }, null);

    const signalCounts = indicatorSignals.reduce((acc, signal) => {
      const key = String(signal?.signal || '').toUpperCase();
      if (key === 'BULLISH') acc.bullish += 1;
      else if (key === 'BEARISH') acc.bearish += 1;
      return acc;
    }, { bullish: 0, bearish: 0 });
    const signalTotal = signalCounts.bullish + signalCounts.bearish;

    let avgRsi = null;
    let rsiCount = 0;
    const macdBias = { bullish: 0, bearish: 0, neutral: 0 };
    let mostVolatile = null;

    Object.entries(summaries).forEach(([symbol, summary]) => {
      const indicators = summary?.indicators || summary || null;
      if (indicators?.rsi != null && Number.isFinite(Number(indicators.rsi))) {
        avgRsi = (avgRsi || 0) + Number(indicators.rsi);
        rsiCount += 1;
      }

      const macd = indicators?.macd;
      if (macd && Number.isFinite(Number(macd.value)) && Number.isFinite(Number(macd.signal))) {
        if (macd.value > macd.signal) macdBias.bullish += 1;
        else if (macd.value < macd.signal) macdBias.bearish += 1;
        else macdBias.neutral += 1;
      } else {
        macdBias.neutral += 1;
      }

      const atr = Number(indicators?.atr);
      if (Number.isFinite(atr)) {
        if (!mostVolatile || atr > mostVolatile.value) {
          mostVolatile = { symbol, value: atr };
        }
      }
    });

    if (avgRsi != null && rsiCount > 0) {
      avgRsi = avgRsi / rsiCount;
    }

    const strongestMomentum = watchlistAll.reduce((best, row) => {
      const change = Number(row.changePercent);
      if (!Number.isFinite(change)) return best;
      if (!best || change > best.change) {
        return { symbol: row.symbol, change };
      }
      return best;
    }, null);

    if (!mostVolatile) {
      const fallback = watchlistAll.reduce((best, row) => {
        const change = Math.abs(Number(row.changePercent));
        if (!Number.isFinite(change)) return best;
        if (!best || change > best.change) {
          return { symbol: row.symbol, change };
        }
        return best;
      }, null);
      if (fallback) mostVolatile = { symbol: fallback.symbol, value: fallback.change };
    }

    return {
      tracked,
      favoriteSector,
      breakoutCount,
      totalScans,
      lastScanTime,
      mostResearched: mostResearched?.symbol || 'N/A',
      bullishPct: signalTotal ? (signalCounts.bullish / signalTotal) * 100 : null,
      bearishPct: signalTotal ? (signalCounts.bearish / signalTotal) * 100 : null,
      avgRsi,
      strongestMomentum: strongestMomentum?.symbol || 'N/A',
      strongestMomentumValue: strongestMomentum?.change ?? null,
      mostVolatile: mostVolatile?.symbol || 'N/A',
      mostVolatileValue: mostVolatile?.value ?? null,
      sectorEntries,
      macdBias,
    };
  }, [watchlistAll, scanResults, breakoutAlerts, indicatorSignals, summaries]);

  const formatTimestamp = (value) => {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="trader-profile-page">
        <div className="profile-state">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="trader-profile-page">
      <div className="trader-profile-shell">
        {!embedded && (
          <button className="profile-back-btn" onClick={() => navigate('/trader/dashboard')}>
            <ArrowLeft size={17} /> Back to Dashboard
          </button>
        )}

        {error && (
          <div className="profile-alert">
            <span>{error}</span>
            <button onClick={loadProfile}>Retry</button>
          </div>
        )}

        <section className="profile-hero-card">
          <div className="profile-photo" aria-label="Profile picture">
            {profile?.profilePicture && profile.profilePicture !== 'null' && profile.profilePicture !== 'undefined' ? (
              <img src={profile.profilePicture} alt="" />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <div className="profile-main-copy">
            <h1>{profile?.username || 'Radar User'}</h1>
            <p>{profile?.email || 'account@radar.com'}</p>
            {profile?.phone && <p className="profile-phone-text" style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>📞 {profile.phone}</p>}
          </div>

          <div className="profile-actions">
            <span className="profile-status-badge">Active</span>
          </div>
        </section>

        <section className="profile-two-column">
          <article className="profile-panel">
            <h2>Account Overview</h2>
            <div className="profile-info-list">
              <p><Calendar size={20} /> <span>Joined On: {formatJoined(profile?.createdAt)}</span></p>
              <p><UserRound size={20} /> <span>Role: User</span></p>
              <p><Hash size={20} /> <span>User ID: {profile?._id || 'N/A'}</span></p>
            </div>
          </article>

          <article className="profile-panel">
            <h2>Your Watchlist Snapshot</h2>
            {watchlist.length === 0 ? (
              <p className="profile-empty"><Zap size={18} /> Your watchlist is empty.</p>
            ) : (
              <div className="profile-watchlist">
                {watchlist.map((item) => (
                  <div className="profile-watch-row" key={item.symbol}>
                    <span>{String(item.symbol || '').replace(/\.(NS|BO)$/i, '')}</span>
                    <strong>{Number(item.price) ? Number(item.price).toFixed(2) : 'N/A'}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="profile-analytics-grid">
          <article className="profile-panel profile-analytics-card">
            <div className="profile-panel-header">
              <h2>Research Activity</h2>
              <span className="profile-panel-badge">Live</span>
            </div>
            {analyticsLoading ? (
              <div className="profile-skeleton">
                <div className="profile-skeleton-line wide" />
                <div className="profile-skeleton-grid">
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                </div>
              </div>
            ) : (
              <div className="profile-metric-grid">
                <div className="profile-metric">
                  <span>Total tracked stocks</span>
                  <strong>{analytics.tracked}</strong>
                </div>
                <div className="profile-metric">
                  <span>Most researched stock</span>
                  <strong>{analytics.mostResearched}</strong>
                </div>
                <div className="profile-metric">
                  <span>Breakout alerts generated</span>
                  <strong>{analytics.breakoutCount}</strong>
                </div>
                <div className="profile-metric">
                  <span>Total scans performed</span>
                  <strong>{analytics.totalScans}</strong>
                </div>
                <div className="profile-metric">
                  <span>Favorite sector</span>
                  <strong>{analytics.favoriteSector}</strong>
                </div>
                <div className="profile-metric">
                  <span>Last active scan time</span>
                  <strong>{formatTimestamp(analytics.lastScanTime)}</strong>
                </div>
              </div>
            )}
          </article>

          <article className="profile-panel profile-analytics-card">
            <div className="profile-panel-header">
              <h2>Trader Insights</h2>
              <span className="profile-panel-badge">Signals</span>
            </div>
            {analyticsLoading ? (
              <div className="profile-skeleton">
                <div className="profile-skeleton-line wide" />
                <div className="profile-skeleton-grid">
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                  <div className="profile-skeleton-line" />
                </div>
              </div>
            ) : (
              <div className="profile-metric-grid">
                <div className="profile-metric">
                  <span>Bullish vs bearish signals</span>
                  <strong>
                    {analytics.bullishPct != null && analytics.bearishPct != null
                      ? `${analytics.bullishPct.toFixed(1)}% / ${analytics.bearishPct.toFixed(1)}%`
                      : 'N/A'}
                  </strong>
                </div>
                <div className="profile-metric">
                  <span>Average watchlist RSI</span>
                  <strong>{analytics.avgRsi != null ? analytics.avgRsi.toFixed(1) : 'N/A'}</strong>
                </div>
                <div className="profile-metric">
                  <span>Strongest momentum stock</span>
                  <strong>
                    {analytics.strongestMomentum}
                    {Number.isFinite(analytics.strongestMomentumValue)
                      ? ` (${analytics.strongestMomentumValue.toFixed(2)}%)`
                      : ''}
                  </strong>
                </div>
                <div className="profile-metric">
                  <span>Most volatile stock</span>
                  <strong>
                    {analytics.mostVolatile}
                    {Number.isFinite(analytics.mostVolatileValue)
                      ? ` (${analytics.mostVolatileValue.toFixed(2)})`
                      : ''}
                  </strong>
                </div>
                <div className="profile-metric">
                  <span>Sector distribution</span>
                  <div className="profile-chip-grid">
                    {analytics.sectorEntries.length === 0 && <span className="profile-chip">N/A</span>}
                    {analytics.sectorEntries.slice(0, 4).map(([sector, count]) => (
                      <span key={sector} className="profile-chip">{sector} ({count})</span>
                    ))}
                  </div>
                </div>
                <div className="profile-metric">
                  <span>Technical sentiment overview</span>
                  <strong>
                    Bullish {analytics.macdBias.bullish}, Bearish {analytics.macdBias.bearish}, Neutral {analytics.macdBias.neutral}
                  </strong>
                </div>
              </div>
            )}

            {!analyticsLoading && analytics.sectorEntries.length > 0 && (
              <div className="profile-heatmap">
                <p className="profile-heatmap-title">Mini sector heatmap</p>
                <div className="profile-heatmap-grid">
                  {analytics.sectorEntries.slice(0, 5).map(([sector, count]) => {
                    const max = analytics.sectorEntries[0][1] || 1;
                    const width = Math.max(14, Math.round((count / max) * 100));
                    return (
                      <div key={sector} className="profile-heat-row">
                        <span>{sector}</span>
                        <div className="profile-heat-bar">
                          <div style={{ width: `${width}%` }} />
                        </div>
                        <em>{count}</em>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        </section>

        <section className="profile-panel">
          <div className="profile-academy-header">
            <h2>Trader Academy</h2>
          </div>
          <p className="profile-section-note"><BookOpen size={19} /> Enhance your trading skills and earn XP to unlock higher ranks.</p>
          <div className="profile-course-grid">
            {courseFallbacks.map((course, index) => {
              const { pct, completed, total } = getCourseProgress(course);
              let buttonText = 'Start Course';
              if (pct === 100) {
                buttonText = 'Completed';
              } else if (pct > 0) {
                buttonText = 'Continue Course';
              }

              return (
                <article className={`profile-course-card ${course.color || (index % 2 === 0 ? 'emerald' : 'purple')}`} key={course._id || course.id || course.title}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  
                  {total > 0 && (
                    <div className="profile-course-progress-container">
                      <div className="profile-course-progress-bar-bg">
                        <div 
                          className="profile-course-progress-bar-fill" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      <span className="profile-course-progress-text">
                        {pct}% complete · {completed}/{total} chapters
                      </span>
                    </div>
                  )}

                  <button onClick={() => navigate('/trader/dashboard/academy')}>{buttonText}</button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default TraderProfilePage;
