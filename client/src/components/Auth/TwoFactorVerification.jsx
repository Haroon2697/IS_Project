import React, { useState } from 'react';
import './Auth.css';

const TwoFactorVerification = ({ onVerify, onCancel, userId }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onVerify(code, userId);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="two-factor-modal">
      <div className="two-factor-content">
        <h2>Two-Factor Authentication</h2>
        <p>Enter the 6-digit code from your authenticator app</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              placeholder="000000"
              maxLength={6}
              className="two-factor-input"
              autoFocus
            />
          </div>
          
          <div className="two-factor-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading || code.length !== 6} className="submit-btn">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorVerification;

