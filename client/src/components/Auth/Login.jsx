import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { twoFactorAPI } from '../../api/twoFactor';
import OAuthLogin from './OAuthLogin';
import TwoFactorVerification from './TwoFactorVerification';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth callback
  useEffect(() => {
    const oauthToken = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    
    if (oauthToken && oauth === 'true') {
      localStorage.setItem('token', oauthToken);
      // Get user data
      authAPI.getCurrentUser()
        .then(response => {
          localStorage.setItem('user', JSON.stringify(response.user));
          navigate('/dashboard');
        })
        .catch(() => {
          setError('Failed to complete OAuth login');
        });
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      // Check if 2FA is required
      if (response.requires2FA) {
        setRequires2FA(true);
        setUserId(response.user.id);
        setToken(response.token); // Store token temporarily
        return;
      }
      
      // Store token
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (code, userId) => {
    try {
      await twoFactorAPI.verify(code, userId);
      
      // 2FA verified, complete login
      localStorage.setItem('token', token);
      const userResponse = await authAPI.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userResponse.user));
      navigate('/dashboard');
    } catch (err) {
      throw err; // Let TwoFactorVerification handle error
    }
  };

  const handle2FACancel = () => {
    setRequires2FA(false);
    setUserId(null);
    setToken(null);
  };

  if (requires2FA) {
    return (
      <TwoFactorVerification
        onVerify={handle2FAVerify}
        onCancel={handle2FACancel}
        userId={userId}
      />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Secure Messaging</h1>
        <h2>Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
        
        <OAuthLogin />
      </div>
    </div>
  );
};

export default Login;

