import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import TwoFactorSettings from '../Settings/TwoFactorSettings';
import KeyExchangeManager from '../KeyExchange/KeyExchangeManager';
import ChatWindow from '../Chat/ChatWindow';
import UserSelector from '../Users/UserSelector';
import socketService from '../../services/socketService';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessionKey, setSessionKey] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Check if user is authenticated
    if (!token || !userData) {
      console.warn('⚠️ No token or user data found, redirecting to login...');
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Connect Socket.io when dashboard loads
      socketService.connect(token);
    } catch (err) {
      console.error('Failed to parse user data:', err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect - keep connection for chat
    };
  }, [navigate]);

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
        
        <div className="key-exchange-section">
          <h2>Secure Connections</h2>
          <p>Establish secure encrypted channels with other users</p>
          
          {!selectedUser ? (
            <UserSelector
              currentUserId={user?.id || user?._id}
              onSelectUser={(selected) => {
                setSelectedUser(selected);
                setSessionKey(null);
                setShowChat(false);
              }}
            />
          ) : (
            <>
              <div className="selected-user-info">
                <span>Selected: <strong>{selectedUser.username}</strong></span>
                <button 
                  onClick={() => {
                    setSelectedUser(null);
                    setSessionKey(null);
                    setShowChat(false);
                  }}
                  className="btn-change-user"
                >
                  Change User
                </button>
              </div>
              
              <KeyExchangeManager
                currentUserId={user?.id}
                currentUsername={user?.username}
                recipientId={selectedUser.id}
                recipientUsername={selectedUser.username}
                onKeyExchangeComplete={(key) => {
                  setSessionKey(key);
                  setShowChat(true);
                }}
              />
            </>
          )}
        </div>
        
        {showChat && sessionKey && selectedUser && (
          <div className="chat-section">
            <h2>Encrypted Chat</h2>
            <ChatWindow
              recipientId={selectedUser.id}
              recipientUsername={selectedUser.username}
              sessionKey={sessionKey}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

