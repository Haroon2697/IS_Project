import React, { useState } from 'react';
import { createInitMessage, processInitMessage, createResponseMessage, processResponseMessage, createConfirmationMessage, verifyConfirmationMessage, createAcknowledgmentMessage } from '../../crypto/keyExchange';
import { retrievePrivateKey, importPublicKey } from '../../crypto/keyManagement';
import { keyExchangeAPI } from '../../api/keyExchange';
import './KeyExchange.css';

const KeyExchangeManager = ({ currentUserId, currentUsername, recipientId, recipientUsername, onKeyExchangeComplete }) => {
  const [status, setStatus] = useState('idle'); // idle, initiating, responding, confirming, established
  const [error, setError] = useState('');
  const [sessionKey, setSessionKey] = useState(null);
  const [longTermPrivateKey, setLongTermPrivateKey] = useState(null);
  const [longTermPublicKey, setLongTermPublicKey] = useState(null);

  // Initialize: Get user's keys
  React.useEffect(() => {
    const loadKeys = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const password = prompt('Enter your password to load keys:');
        
        if (!password) return;
        
        const privateKey = await retrievePrivateKey(user.username, password);
        setLongTermPrivateKey(privateKey);
        
        // Get public key from server
        const publicKeyResponse = await keyExchangeAPI.getUserPublicKey(user.id);
        const publicKeyJwk = typeof publicKeyResponse.publicKey === 'string' 
          ? JSON.parse(publicKeyResponse.publicKey)
          : publicKeyResponse.publicKey;
        const publicKey = await importPublicKey(publicKeyJwk);
        setLongTermPublicKey(publicKey);
      } catch (err) {
        setError('Failed to load keys: ' + err.message);
      }
    };
    
    if (currentUserId) {
      loadKeys();
    }
  }, [currentUserId]);

  // Initiate key exchange
  const handleInitiate = async () => {
    if (!longTermPrivateKey || !longTermPublicKey) {
      setError('Keys not loaded. Please refresh the page.');
      return;
    }

    try {
      setStatus('initiating');
      setError('');

      // Create init message
      const initMessage = await createInitMessage(
        currentUserId,
        recipientId,
        longTermPrivateKey,
        longTermPublicKey
      );

      // Send to server
      await keyExchangeAPI.sendInit(initMessage);

      // Store init message data for later use
      localStorage.setItem('keyExchange_init', JSON.stringify({
        message: initMessage,
        recipientId,
        timestamp: Date.now(),
      }));

      setStatus('initiated');
    } catch (err) {
      setError('Failed to initiate key exchange: ' + err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="key-exchange-manager">
      <h3>Key Exchange with {recipientUsername}</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="key-exchange-status">
        Status: <strong>{status}</strong>
        {sessionKey && <span className="success"> ✅ Session key established</span>}
      </div>
      
      {status === 'idle' && (
        <button onClick={handleInitiate} className="btn-primary">
          Establish Secure Connection
        </button>
      )}
      
      {status === 'initiated' && (
        <div className="waiting">
          Waiting for response from {recipientUsername}...
        </div>
      )}
      
      {sessionKey && (
        <div className="success-message">
          ✅ Secure channel established! You can now send encrypted messages.
        </div>
      )}
    </div>
  );
};

export default KeyExchangeManager;

