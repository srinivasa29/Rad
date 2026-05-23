import React, { useState, useEffect, useContext, useRef } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SettingsContext } from '../../context/SettingsContext';
import api from '../../api/api';
import './SettingsPage.css';

const SettingsPage = ({ embedded = false } = {}) => {
  const navigate = useNavigate();
  const { settings: ctxSettings, saveSettings: saveToServer } = useContext(SettingsContext);
  const toastTimerRef = useRef(null);

  // Left Card State: Terminal & Market
  const [terminal, setTerminal] = useState({
    defaultLandingPage: 'Dashboard',
    defaultChartTimeframe: '5m',
    defaultChartType: 'Candlestick',
  });

  const [marketDisplay, setMarketDisplay] = useState({
    defaultMarket: 'NSE',
    currencyFormat: 'INR',
    theme: 'Dark',
    showMarketStatusBadge: true,
  });

  // Right Card State: Alerts & Security
  const [alerts, setAlerts] = useState({
    priceAlerts: true,
    technicalSignals: true, // Breakout Alerts
    volumeSpikes: true,     // RSI Alerts
    marketNewsAlerts: true, // News Alerts
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingAll, setSavingAll] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Sync state with settings context
  useEffect(() => {
    if (!ctxSettings) return;
    setTerminal({
      defaultLandingPage: ctxSettings.terminal?.defaultLandingPage || 'Dashboard',
      defaultChartTimeframe: ctxSettings.terminal?.defaultChartTimeframe || '5m',
      defaultChartType: ctxSettings.terminal?.defaultChartType || 'Candlestick',
    });
    setMarketDisplay({
      defaultMarket: ctxSettings.marketDisplay?.defaultMarket || 'NSE',
      currencyFormat: ctxSettings.marketDisplay?.currencyFormat || 'INR',
      theme: ctxSettings.marketDisplay?.theme || 'Dark',
      showMarketStatusBadge: ctxSettings.marketDisplay?.showMarketStatusBadge ?? true,
    });
    setAlerts({
      priceAlerts: ctxSettings.alerts?.priceAlerts ?? true,
      technicalSignals: ctxSettings.alerts?.technicalSignals ?? true,
      volumeSpikes: ctxSettings.alerts?.volumeSpikes ?? true,
      marketNewsAlerts: ctxSettings.alerts?.marketNewsAlerts ?? true,
    });
    setSecurity({
      twoFactorAuth: ctxSettings.security?.twoFactorAuth ?? false,
    });
  }, [ctxSettings]);

  const handleBack = () => {
    navigate('/trader/dashboard');
  };

  // Unified save handler
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSavingAll(true);
    try {
      // 1. If password fields are typed, validate and update first
      if (passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword) {
        const { currentPassword, newPassword, confirmPassword } = passwordForm;
        if (!currentPassword) {
          showToast('error', 'Please enter your current password.');
          setSavingAll(false);
          return;
        }
        if (!newPassword || newPassword.length < 8) {
          showToast('error', 'New password must be at least 8 characters.');
          setSavingAll(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          showToast('error', 'New passwords do not match.');
          setSavingAll(false);
          return;
        }
        await api.patch('/user/password', { currentPassword, newPassword });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }

      // 2. Save preferences settings to DB (including syncing display parameters)
      await saveToServer({
        display: {
          ...ctxSettings?.display,
          chartType: terminal.defaultChartType.toLowerCase(),
          defaultTimeframe: terminal.defaultChartTimeframe,
          theme: marketDisplay.theme.toLowerCase(),
        },
        terminal: {
          ...ctxSettings?.terminal,
          ...terminal,
        },
        marketDisplay: {
          ...ctxSettings?.marketDisplay,
          ...marketDisplay,
        },
        alerts: {
          ...ctxSettings?.alerts,
          ...alerts,
        },
        security: {
          ...ctxSettings?.security,
          twoFactorAuth: security.twoFactorAuth,
        }
      });
      showToast('success', 'Preferences saved successfully.');
    } catch (err) {
      showToast('error', err?.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSavingAll(false);
    }
  };

  // Reset to default presets
  const handleResetDefaults = async () => {
    setSavingAll(true);
    const defaults = {
      display: {
        ...ctxSettings?.display,
        chartType: 'candlestick',
        defaultTimeframe: '5m',
        theme: 'dark',
      },
      terminal: {
        ...ctxSettings?.terminal,
        defaultLandingPage: 'Dashboard',
        defaultChartTimeframe: '5m',
        defaultChartType: 'Candlestick',
      },
      marketDisplay: {
        ...ctxSettings?.marketDisplay,
        defaultMarket: 'NSE',
        currencyFormat: 'INR',
        theme: 'Dark',
        showMarketStatusBadge: true,
      },
      alerts: {
        ...ctxSettings?.alerts,
        priceAlerts: true,
        technicalSignals: true,
        volumeSpikes: true,
        marketNewsAlerts: true,
      },
      security: {
        ...ctxSettings?.security,
        twoFactorAuth: false,
      }
    };

    try {
      await saveToServer(defaults);
      setTerminal({
        defaultLandingPage: 'Dashboard',
        defaultChartTimeframe: '5m',
        defaultChartType: 'Candlestick',
      });
      setMarketDisplay({
        defaultMarket: 'NSE',
        currencyFormat: 'INR',
        theme: 'Dark',
        showMarketStatusBadge: true,
      });
      setAlerts({
        priceAlerts: true,
        technicalSignals: true,
        volumeSpikes: true,
        marketNewsAlerts: true,
      });
      setSecurity({
        twoFactorAuth: false,
      });
      showToast('success', 'Restored default settings.');
    } catch (err) {
      showToast('error', err?.response?.data?.error || 'Failed to reset settings.');
    } finally {
      setSavingAll(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await api.post('/user/logout-all');
      localStorage.removeItem('token');
      showToast('success', 'Logged out from all devices.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      showToast('error', err?.response?.data?.error || 'Logout failed.');
      setLoggingOutAll(false);
    }
  };

  const renderSwitch = (label, value, onChange) => (
    <div className={`settings-switch-item ${value ? 'active' : ''}`} onClick={() => onChange(!value)}>
      <span className="settings-switch-label">{label}</span>
      <div className="settings-switch-track">
        <div className="settings-switch-thumb" />
      </div>
    </div>
  );

  const renderDropdown = (label, value, options, onChange) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="form-select">
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="settings-page">
      {/* Background Glow */}
      <div className="settings-gradient-bg" />

      {/* Header (Matching Help & Support exactly) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="settings-header"
      >
        <div className="settings-header-content">
          <div className="settings-header-left">
            {!embedded && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="settings-back-btn"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </motion.button>
            )}
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Customize your RADAR trading experience</p>
          </div>
        </div>
      </motion.div>

      {/* Container (Matching Help & Support Container) */}
      <div className="settings-container">
        <form onSubmit={handleSaveAll}>
          {/* Two-Column Grid */}
          <div className="settings-main-content">
            
            {/* LEFT COLUMN: Terminal & Market */}
            <div className="settings-column">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="settings-card"
              >
                <h3 className="settings-card-title">Terminal & Market</h3>
                
                {renderDropdown(
                  'Default Landing Page',
                  terminal.defaultLandingPage,
                  [
                    { value: 'Dashboard', label: 'Dashboard' },
                    { value: 'Watchlist', label: 'Watchlist' },
                    { value: 'Screener', label: 'Screener' },
                    { value: 'News', label: 'News' }
                  ],
                  (v) => setTerminal(prev => ({ ...prev, defaultLandingPage: v }))
                )}

                {renderDropdown(
                  'Default Chart Timeframe',
                  terminal.defaultChartTimeframe,
                  [
                    { value: '1m', label: '1 Minute (1m)' },
                    { value: '5m', label: '5 Minutes (5m)' },
                    { value: '15m', label: '15 Minutes (15m)' },
                    { value: '1H', label: '1 Hour (1H)' },
                    { value: '1D', label: '1 Day (1D)' }
                  ],
                  (v) => setTerminal(prev => ({ ...prev, defaultChartTimeframe: v }))
                )}

                {renderDropdown(
                  'Default Chart Type',
                  terminal.defaultChartType,
                  [
                    { value: 'Candlestick', label: 'Candlestick' },
                    { value: 'Line', label: 'Line' },
                    { value: 'Area', label: 'Area' }
                  ],
                  (v) => setTerminal(prev => ({ ...prev, defaultChartType: v }))
                )}

                {renderDropdown(
                  'Default Market',
                  marketDisplay.defaultMarket,
                  [
                    { value: 'NSE', label: 'NSE (India)' },
                    { value: 'BSE', label: 'BSE (India)' }
                  ],
                  (v) => setMarketDisplay(prev => ({ ...prev, defaultMarket: v }))
                )}

                {renderDropdown(
                  'Currency Format',
                  marketDisplay.currencyFormat,
                  [
                    { value: 'INR', label: 'INR (₹)' },
                    { value: 'USD', label: 'USD ($)' }
                  ],
                  (v) => setMarketDisplay(prev => ({ ...prev, currencyFormat: v }))
                )}

                <div className="settings-switches-group">
                  {renderSwitch(
                    'Dark Mode',
                    marketDisplay.theme === 'Dark',
                    (isDark) => setMarketDisplay(prev => ({ ...prev, theme: isDark ? 'Dark' : 'Light' }))
                  )}

                  {renderSwitch(
                    'Show Market Status Badge',
                    marketDisplay.showMarketStatusBadge,
                    (v) => setMarketDisplay(prev => ({ ...prev, showMarketStatusBadge: v }))
                  )}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Alerts & Security */}
            <div className="settings-column">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="settings-card"
              >
                <h3 className="settings-card-title">Alerts & Security</h3>
                
                <div className="settings-switches-group">
                  {renderSwitch(
                    'Price Alerts',
                    alerts.priceAlerts,
                    (v) => setAlerts(prev => ({ ...prev, priceAlerts: v }))
                  )}

                  {renderSwitch(
                    'Breakout Alerts',
                    alerts.technicalSignals,
                    (v) => setAlerts(prev => ({ ...prev, technicalSignals: v }))
                  )}

                  {renderSwitch(
                    'RSI Alerts',
                    alerts.volumeSpikes,
                    (v) => setAlerts(prev => ({ ...prev, volumeSpikes: v }))
                  )}

                  {renderSwitch(
                    'News Alerts',
                    alerts.marketNewsAlerts,
                    (v) => setAlerts(prev => ({ ...prev, marketNewsAlerts: v }))
                  )}

                  {renderSwitch(
                    'Two Factor Authentication (2FA)',
                    security.twoFactorAuth,
                    (v) => setSecurity(prev => ({ ...prev, twoFactorAuth: v }))
                  )}
                </div>

                <div className="settings-divider" />

                {/* Change Password Section */}
                <div className="settings-sub-section">
                  <h4 className="settings-sub-title">Change Password</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      autoComplete="current-password"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      autoComplete="new-password"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      autoComplete="new-password"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="settings-divider" />

                {/* Logout Trigger */}
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  disabled={loggingOutAll}
                  className="settings-logout-btn"
                >
                  {loggingOutAll ? 'Logging out...' : 'Logout All Devices'}
                </button>
              </motion.div>
            </div>

          </div>

          {/* Centered Footer Submit Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="settings-actions-footer"
          >
            <button type="submit" className="settings-submit-btn" disabled={savingAll}>
              <Save size={18} />
              {savingAll ? 'Saving Settings...' : 'Save Settings'}
            </button>
            
            <button type="button" onClick={handleResetDefaults} className="settings-reset-link" disabled={savingAll}>
              Reset to Defaults
            </button>
          </motion.div>
        </form>
      </div>

      {/* Toast (Matches Help Page Success notification styles) */}
      {toast && (
        <div className={`settings-toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
