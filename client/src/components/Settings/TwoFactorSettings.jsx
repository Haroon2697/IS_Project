import React, { useState, useEffect } from 'react';
import { twoFactorAPI } from '../../api/twoFactor';
import './Settings.css';

const TwoFactorSettings = () => {
  const [status, setStatus] = useState({ enabled: false });
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await twoFactorAPI.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load 2FA status:', err);
    }
  };

  const handleSetup = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await twoFactorAPI.setup();
      setSetupData(data);
      setShowBackupCodes(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔐 Verifying 2FA code...');
      await twoFactorAPI.verifyAndEnable(verificationCode);
      setSetupData(null);
      setVerificationCode('');
      setShowBackupCodes(false);
      await loadStatus();
      alert('2FA enabled successfully!');
    } catch (err) {
      console.error('2FA verification error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Invalid verification code';
      setError(errorMsg);
      
      // Don't redirect on 2FA failure - user is still logged in
      // Only show error message
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      await twoFactorAPI.disable(password);
      setPassword('');
      await loadStatus();
      alert('2FA disabled successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (setupData) {
    return (
      <div className="settings-card">
        <h2>Enable Two-Factor Authentication</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="qr-code-container">
          <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          <img src={setupData.qrCode} alt="QR Code" className="qr-code" />
        </div>

        {showBackupCodes && (
          <div className="backup-codes">
            <h3>Backup Codes (Save these securely!)</h3>
            <p>These codes can be used if you lose access to your authenticator app. Each code can only be used once.</p>
            <div className="backup-codes-list">
              {setupData.backupCodes.map((code, index) => (
                <code key={index}>{code}</code>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleVerifyAndEnable}>
          <div className="form-group">
            <label>Enter 6-digit code from your app</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>
          
          <button type="submit" disabled={loading || verificationCode.length !== 6} className="submit-btn">
            {loading ? 'Enabling...' : 'Enable 2FA'}
          </button>
          <button type="button" onClick={() => setSetupData(null)} className="cancel-btn">
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="settings-card">
      <h2>Two-Factor Authentication</h2>
      
      {status.enabled ? (
        <div>
          <p className="status-enabled">✅ 2FA is enabled</p>
          <form onSubmit={handleDisable}>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label>Enter your password to disable 2FA</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="danger-btn">
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <p className="status-disabled">❌ 2FA is not enabled</p>
          <p>Add an extra layer of security to your account by enabling two-factor authentication.</p>
          <button onClick={handleSetup} disabled={loading} className="submit-btn">
            {loading ? 'Setting up...' : 'Enable 2FA'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSettings;

