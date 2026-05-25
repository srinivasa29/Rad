import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, Save, Lock, Eye, EyeOff, User, Monitor, Camera, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/api';
import { fetchUserProfile, updateUserProfile } from '../../api/userApi';
import './SettingsPage.css';

const resizeProfileImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Unable to read profile picture'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Unable to process profile picture'));
    image.onload = () => {
      const maxSize = 360;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.src = String(reader.result || '');
  };
  reader.readAsDataURL(file);
});

const SettingsPage = ({ embedded = false } = {}) => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Profile data state
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // Password fields state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Async states
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
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

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetchUserProfile();
      setProfile(res);
      setUsername(res.username || '');
      setEmail(res.email || '');
      setPhone(res.phone || '');
      setProfilePicture(res.profilePicture || '');
    } catch (error) {
      showToast('error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleBack = () => {
    const mode = String(localStorage.getItem('mode') || 'INVESTOR').toUpperCase();
    if (mode === 'TRADER') {
      navigate('/trader/dashboard');
    } else {
      navigate('/investor/dashboard');
    }
  };

  const handlePhotoPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeProfileImage(file);
      setProfilePicture(resized);
    } catch (err) {
      showToast('error', err.message || 'Unable to use this profile picture');
    } finally {
      event.target.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateUserProfile({
        username,
        email,
        phone,
        profilePicture
      });
      const nextProfile = { ...profile, ...updated };
      setProfile(nextProfile);
      
      // Update local storage
      localStorage.setItem('profileImage', nextProfile.profilePicture || '');
      if (nextProfile.username) localStorage.setItem('username', nextProfile.username);
      if (nextProfile.email) localStorage.setItem('email', nextProfile.email);

      // Fire profile update event
      window.dispatchEvent(new CustomEvent('radar:profile-updated', { detail: nextProfile }));
      
      showToast('success', 'Profile information saved successfully.');
    } catch (err) {
      showToast('error', err?.response?.data?.error || 'Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword) {
      showToast('error', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch('/user/password', { currentPassword, newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('success', 'Password updated successfully.');
    } catch (err) {
      showToast('error', err?.response?.data?.error || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await api.post('/user/logout-all');
      localStorage.removeItem('token');
      localStorage.removeItem('profileImage');
      showToast('success', 'Logged out from all devices.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      showToast('error', err?.response?.data?.error || 'Logout failed.');
      setLoggingOutAll(false);
    }
  };

  const initial = useMemo(() => {
    const source = username || email || 'R';
    return source.trim().charAt(0).toUpperCase() || 'R';
  }, [username, email]);

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-gradient-bg" />
        <div className="settings-container" style={{ textAlign: 'center', padding: '100px 0', color: '#fff' }}>
          Loading your settings...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Background Glow */}
      <div className="settings-gradient-bg" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="settings-header"
      >
        <div className="settings-header-content">
          <div className="settings-header-left-row">
            <div className="settings-header-icon-badge">
              <Settings size={22} />
            </div>
            <div>
              <h1 className="settings-title">Settings</h1>
              <p className="settings-subtitle">Manage your profile and password</p>
            </div>
          </div>
          {!embedded && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="settings-back-btn"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Container */}
      <div className="settings-container">
        <div className="settings-main-content">
          
          {/* LEFT COLUMN: Profile Information */}
          <div className="settings-column">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="settings-card"
            >
              <div className="settings-card-header">
                <div className="settings-card-icon-circle blue">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="settings-card-heading">Profile Information</h3>
                  <p className="settings-card-subheading">Update your personal details and profile photo.</p>
                </div>
              </div>

              <div className="profile-info-layout">
                <div className="profile-avatar-selector-section">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoPick}
                    style={{ display: 'none' }}
                  />
                  <div className="settings-avatar-circle" onClick={() => fileRef.current?.click()}>
                    {profilePicture && profilePicture !== 'null' && profilePicture !== 'undefined' ? (
                      <img src={profilePicture} alt="Profile" />
                    ) : (
                      <div className="settings-avatar-placeholder">{initial}</div>
                    )}
                    <div className="settings-avatar-edit-badge">
                      <Camera size={12} />
                    </div>
                  </div>
                  {profilePicture && profilePicture !== 'null' && profilePicture !== 'undefined' && (
                    <button
                      type="button"
                      className="settings-avatar-remove-btn"
                      onClick={() => setProfilePicture('')}
                    >
                      Remove photo
                    </button>
                  )}
                </div>

                <div className="profile-fields-section">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Full Name"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="settings-submit-btn-blue"
              >
                <Save size={16} />
                {savingProfile ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Change Password & Session Management */}
          <div className="settings-column">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="settings-card"
            >
              <div className="settings-card-header">
                <div className="settings-card-icon-circle purple">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="settings-card-heading">Change Password</h3>
                  <p className="settings-card-subheading">Update your password to keep your account secure.</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="password-input-box">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-hide-show-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="password-input-box">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-hide-show-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="password-input-box">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-hide-show-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={savingPassword}
                className="settings-submit-btn-purple"
              >
                <Lock size={16} />
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="settings-card"
              style={{ marginTop: '2rem' }}
            >
              <div className="settings-card-header">
                <div className="settings-card-icon-circle red">
                  <Monitor size={18} />
                </div>
                <div>
                  <h3 className="settings-card-heading">Session Management</h3>
                  <p className="settings-card-subheading">Sign out from all devices to secure your account.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
                className="settings-logout-btn-outline"
              >
                Logout All Devices
              </button>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Toast notifications */}
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
