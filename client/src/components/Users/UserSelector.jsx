import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../api/users';
import './UserSelector.css';

const UserSelector = ({ currentUserId, onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only load users if currentUserId is set (user is authenticated)
    if (currentUserId) {
      loadUsers();
    }
  }, [currentUserId]); // Only reload when currentUserId changes

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading users list...');
      const response = await usersAPI.getUsersList();
      console.log('Users list response:', response);
      setUsers(response.users || []);
      if (response.users && response.users.length === 0) {
        console.log('No other users found. Current user ID:', currentUserId);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError('Failed to load users: ' + errorMsg);
      console.error('Load users error:', err);
      console.error('Error response:', err.response);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="user-selector loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="user-selector">
        <div className="error-message">{error}</div>
        <button onClick={loadUsers} className="btn-retry">Retry</button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="user-selector">
        <p className="no-users">No other users found. Register another account to test messaging!</p>
        <button onClick={loadUsers} className="btn-refresh">Refresh</button>
      </div>
    );
  }

  // Filter out current user on client side as well (backup)
  const filteredUsers = users.filter(user => {
    if (!currentUserId) return true; // If currentUserId not provided, show all (server should filter)
    return user.id !== currentUserId;
  });

  return (
    <div className="user-selector">
      <h3>Select User to Chat With</h3>
      {filteredUsers.length === 0 ? (
        <div className="no-users">
          <p>No other users found. Register another account to test messaging!</p>
          <button onClick={loadUsers} className="btn-refresh">Refresh List</button>
        </div>
      ) : (
        <>
          <div className="users-list">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="user-item"
                onClick={() => onSelectUser(user)}
              >
                <div className="user-info">
                  <span className="username">{user.username}</span>
                  {user.hasPublicKey && (
                    <span className="key-indicator" title="Has public key">🔑</span>
                  )}
                </div>
                <div className="user-email">{user.email}</div>
              </div>
            ))}
          </div>
          <button onClick={loadUsers} className="btn-refresh">Refresh List</button>
        </>
      )}
    </div>
  );
};

export default UserSelector;

