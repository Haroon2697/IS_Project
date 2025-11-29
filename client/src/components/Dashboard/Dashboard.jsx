import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import TwoFactorSettings from '../Settings/TwoFactorSettings';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Secure Messaging Dashboard</h1>
        <div className="user-info">
          {user && (
            <span>Welcome, {user.username}!</span>
          )}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to Secure Messaging!</h2>
          <p>You are successfully authenticated.</p>
          <p>Next steps: Key generation and secure messaging will be implemented here.</p>
        </div>
        
        <div className="settings-section">
          <h2>Security Settings</h2>
          <TwoFactorSettings />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

