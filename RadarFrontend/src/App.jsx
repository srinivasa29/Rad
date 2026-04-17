import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { AssetProvider } from './context/AssetContext';
import {
  VerifyEmailPage,
  ResetPasswordPage,
  GlobalSearchPage,
  DiscoveryPage,
  CalendarPage,
  NewsPage,
  WatchlistsPage,
  PortfolioPage,
  AlertsPage,
  ReportsExportPage,
  ProfilePage,
  SettingsPage,
  InvestorFilingsPage,
} from './pages/ContractPages';



const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const TraderStockPage = lazy(() => import('./pages/TraderStockPage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const RealtimeDemoPage = lazy(() => import('./pages/RealtimeDemoPage'));
const SpecShowcasePage = lazy(() => import('./pages/SpecShowcase'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const InvestorStockPage = lazy(() => import('./pages/InvestorStockPage'));
const MarketResearchDashboard = lazy(() => import('./pages/MarketResearchDashboard'));
const ScreenerPage = lazy(() => import('./pages/ScreenerPage'));

const AppLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#020617] text-[#E2E8F0]">
    <div className="text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-[#00f3ff]/30 border-t-[#00f3ff] animate-spin" />
      <p className="text-sm font-semibold tracking-wide">Loading RADAR...</p>
    </div>
  </div>
);

const RouteStatusPage = ({ title, message, actionTo = '/', actionLabel = 'Go Home' }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#020617] text-[#E2E8F0] px-4">
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      <h1 className="text-3xl font-black tracking-tight mb-3">{title}</h1>
      <p className="text-sm text-[#cbd5e1] mb-6">{message}</p>
      <Link
        to={actionTo}
        className="inline-flex items-center justify-center rounded-xl bg-[#00f3ff] text-[#0f172a] px-5 py-2.5 font-bold text-sm"
      >
        {actionLabel}
      </Link>
    </div>
  </div>
);

const DashboardAliasRoute = ({ mode, module }) => {
  if (typeof window !== 'undefined' && mode) {
    localStorage.setItem('mode', mode);
  }

  const query = module ? `?module=${encodeURIComponent(module)}` : '';
  return <Navigate to={`/dashboard${query}`} replace />;
};

const AssetAliasRoute = () => {
  const { symbol } = useParams();
  const nextSymbol = encodeURIComponent(String(symbol || '').trim());
  return <Navigate to={`/stocks/${nextSymbol}`} replace />;
};

const OAuthCallbackRoute = () => {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));

    const token = searchParams.get('token')
      || searchParams.get('access_token')
      || hashParams.get('token')
      || hashParams.get('access_token');

    const mode = searchParams.get('mode') || hashParams.get('mode');

    if (token) {
      localStorage.setItem('token', token);
    }

    if (mode) {
      localStorage.setItem('mode', String(mode).toUpperCase() === 'TRADER' ? 'TRADER' : 'INVESTOR');
    }

    window.location.replace(token ? '/dashboard' : '/login');
  }, [location.hash, location.search]);

  return <AppLoader />;
};

function App() {
  return (
    <AssetProvider>
      <Router>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/trader" element={<DashboardAliasRoute mode="TRADER" />} />
            <Route path="/dashboard/investor" element={<DashboardAliasRoute mode="INVESTOR" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/oauth/callback" element={<OAuthCallbackRoute />} />
            <Route path="/stocks/:symbol" element={<TraderStockPage />} />
            <Route path="/investor-stock/:symbol" element={<InvestorStockPage />} />
            <Route path="/asset/:symbol" element={<AssetAliasRoute />} />
            <Route path="/trader/momentum" element={<DashboardAliasRoute mode="TRADER" module="DASHBOARD" />} />
            <Route path="/investor/valuation" element={<DashboardAliasRoute mode="INVESTOR" module="DASHBOARD" />} />
            <Route path="/investor/filings" element={<InvestorFilingsPage />} />
            <Route path="/screener" element={<ScreenerPage />} />
            <Route path="/search" element={<GlobalSearchPage />} />
            <Route path="/discovery" element={<DiscoveryPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/watchlists" element={<WatchlistsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/reports/export" element={<ReportsExportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/health" element={<Navigate to="/admin" replace />} />
            <Route path="/demo" element={<RealtimeDemoPage />} />
            <Route path="/research-dashboard" element={<MarketResearchDashboard />} />
            <Route path="/spec/components" element={<SpecShowcasePage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/404" element={<RouteStatusPage title="404 - Not Found" message="The page you requested does not exist or may have moved." actionTo="/" actionLabel="Return Home" />} />
            <Route path="/500" element={<RouteStatusPage title="500 - Server Error" message="Something went wrong while processing your request. Please try again." actionTo="/" actionLabel="Return Home" />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AssetProvider>
  );
}

export default App;
