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
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Connect Socket.io when dashboard loads
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect - keep connection for chat
    };
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
        
        <div className="key-exchange-section">
          <h2>Secure Connections</h2>
          <p>Establish secure encrypted channels with other users</p>
          
          {!selectedUser ? (
            <UserSelector
              currentUserId={user?.id}
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

