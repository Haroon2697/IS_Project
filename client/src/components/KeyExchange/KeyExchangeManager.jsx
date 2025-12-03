import React, { useState, useEffect, useRef } from 'react';
import { createInitMessage, processInitMessage, createResponseMessage, processResponseMessage, createConfirmationMessage, verifyConfirmationMessage, createAcknowledgmentMessage, deriveSessionKeyAsResponder } from '../../crypto/keyExchange';
import { retrievePrivateKey, importPublicKey, generateAndStoreKeys, hasKeys } from '../../crypto/keyManagement';
import { keyExchangeAPI } from '../../api/keyExchange';
import socketService from '../../services/socketService';
import './KeyExchange.css';

const KeyExchangeManager = ({ currentUserId, currentUsername, recipientId, recipientUsername, onKeyExchangeComplete }) => {
  const [status, setStatus] = useState('idle'); // idle, initiating, responding, confirming, established
  const [error, setError] = useState('');
  const [sessionKey, setSessionKey] = useState(null);
  const [longTermPrivateKey, setLongTermPrivateKey] = useState(null);
  const [longTermPublicKey, setLongTermPublicKey] = useState(null);
  // Use useRef to persist ephemeral keys across re-renders
  const ephemeralPrivateKeysRef = React.useRef(new Map());
  // Use ref to store session key for confirmation handling (CryptoKey can't be serialized)
  const sessionKeyRef = React.useRef(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [showRegenerateOption, setShowRegenerateOption] = useState(false);

  // Log current user info on mount and when props change
  useEffect(() => {
    console.log('🔐 KeyExchangeManager initialized:');
    console.log('   Current User:', currentUsername, '(ID:', currentUserId, ')');
    console.log('   Recipient:', recipientUsername, '(ID:', recipientId, ')');
  }, [currentUserId, currentUsername, recipientId, recipientUsername]);

  // Load keys function (called on button click to avoid React concurrent rendering issues)
  const loadKeys = async () => {
    // Don't load keys if already loaded or currently loading
    if (keysLoaded || keysLoading || longTermPrivateKey || longTermPublicKey) {
      return;
    }

    setKeysLoading(true);
    setError('');
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        setKeysLoading(false);
        setError('User not found. Please log in again.');
        return;
      }

      // Check if keys exist for this user
      const { hasKeys } = await import('../../crypto/keyManagement');
      const userHasKeys = await hasKeys(user.username);
      
      if (!userHasKeys) {
        setKeysLoading(false);
        setError(`No keys found for "${user.username}". This can happen if you registered on a different browser or cleared browser data. Please register again with a new account.`);
        return;
      }

      // Use setTimeout to avoid React concurrent rendering issues with prompt()
      const password = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(prompt('Enter your password to load keys (same password you used during registration):'));
        }, 100);
      });
      
      if (!password) {
        setKeysLoading(false);
        setError('Password required to load keys');
        return;
      }
      
      console.log('🔑 Loading keys for user:', user.username);
      const privateKey = await retrievePrivateKey(user.username, password);
      setLongTermPrivateKey(privateKey);
      console.log('✅ Private key loaded');
      
      // Get public key from server
      const publicKeyResponse = await keyExchangeAPI.getUserPublicKey(user.id);
      const publicKeyJwk = typeof publicKeyResponse.publicKey === 'string' 
        ? JSON.parse(publicKeyResponse.publicKey)
        : publicKeyResponse.publicKey;
      const publicKey = await importPublicKey(publicKeyJwk);
      setLongTermPublicKey(publicKey);
      console.log('✅ Public key loaded');
      
      setKeysLoaded(true);
    } catch (err) {
      console.error('❌ Failed to load keys:', err);
      if (err.message.includes('Wrong password') || err.message.includes('decrypt')) {
        setError('Wrong password or corrupted keys. Click "Regenerate Keys" to create new keys.');
        setShowRegenerateOption(true);
      } else {
        setError('Failed to load keys: ' + err.message);
      }
    } finally {
      setKeysLoading(false);
    }
  };

  // Regenerate keys for user (when keys are lost or password forgotten)
  const regenerateKeys = async () => {
    setKeysLoading(true);
    setError('');
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        setError('User not found. Please log in again.');
        return;
      }

      const password = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(prompt('Enter a NEW password to encrypt your new keys.\nThis will replace any existing keys:'));
        }, 100);
      });
      
      if (!password) {
        setError('Password required');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      console.log('🔑 Regenerating keys for user:', user.username);
      
      // Generate new keys
      const keyData = await generateAndStoreKeys(user.username, password);
      console.log('✅ New keys generated');
      
      // Update public key on server
      await keyExchangeAPI.updatePublicKey(user.id, JSON.stringify(keyData.publicKey));
      console.log('✅ Public key updated on server');
      
      // Now load the keys
      const privateKey = await retrievePrivateKey(user.username, password);
      setLongTermPrivateKey(privateKey);
      
      const publicKey = await importPublicKey(keyData.publicKey);
      setLongTermPublicKey(publicKey);
      
      setKeysLoaded(true);
      setShowRegenerateOption(false);
      setError('');
      console.log('✅ Keys regenerated and loaded successfully!');
      alert('Keys regenerated successfully! You can now establish secure connections.');
    } catch (err) {
      console.error('❌ Failed to regenerate keys:', err);
      setError('Failed to regenerate keys: ' + err.message);
    } finally {
      setKeysLoading(false);
    }
  };

  // Initialize: Connect Socket.io (keys loaded on demand)
  useEffect(() => {

    // Connect Socket.io for key exchange
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }

    // Listen for incoming key exchange messages
    const handleKeyExchangeMessage = async (message) => {
      try {
        console.log('🔑 Received key exchange message:', message.type || 'unknown');
        
        // Handle different message types
        if (message.type === 'response' || message.messageType === 'response') {
          // This is a response to our init
          await handleResponseMessage(message);
        } else if (message.type === 'init' || message.messageType === 'init' || message.type === 'KEY_EXCHANGE_INIT') {
          // This is an init from someone else - we should respond
          // Check if keys are loaded first
          if (!longTermPrivateKey || ! longTermPublicKey) {
            console.log('⏳ Keys not loaded yet, waiting 2 seconds...');
            setTimeout(async () => {
              if (longTermPrivateKey && longTermPublicKey) {
                await handleInitMessage(message);
              } else {
                console.error('Keys still not loaded after waiting');
                setError('Keys not loaded. Please refresh the page and enter your password.');
              }
            }, 2000);
          } else {
            await handleInitMessage(message);
          }
        } else if (message.type === 'confirm' || message.messageType === 'confirm') {
          // This is a confirmation
          await handleConfirmMessage(message);
        } else if (message.type === 'acknowledge' || message.messageType === 'acknowledge') {
          // This is an acknowledgment
          await handleAcknowledgeMessage(message);
        }
      } catch (err) {
        console.error('Error handling key exchange message:', err);
        setError('Failed to process key exchange message: ' + err.message);
      }
    };

    socketService.onKeyExchange(handleKeyExchangeMessage);

    return () => {
      socketService.offKeyExchange(handleKeyExchangeMessage);
    };
  }, [currentUserId, recipientId, longTermPrivateKey, longTermPublicKey, keysLoaded, keysLoading]);

  // Handle response message
  const handleResponseMessage = async (responseMessage) => {
    try {
      const storedInit = localStorage.getItem('keyExchange_init');
      if (!storedInit) {
        console.error('No stored init message found');
        setError('No stored init message. Please restart key exchange.');
        return;
      }

      const { message: initMessage, recipientId: storedRecipientId } = JSON.parse(storedInit);
      
      // The sender of the response is the recipient we initiated with
      const responseSenderId = responseMessage.senderId || responseMessage.receiverId;
      
      // Get ephemeral private key from ref (persists across re-renders)
      // Use the stored recipientId (who we initiated with) to find the key
      console.log('🔍 Looking for ephemeral key for recipient:', storedRecipientId);
      console.log('🔍 Ephemeral keys map size:', ephemeralPrivateKeysRef.current.size);
      console.log('🔍 Available keys:', Array.from(ephemeralPrivateKeysRef.current.keys()));
      
      let ephemeralPrivateKey = ephemeralPrivateKeysRef.current.get(storedRecipientId);
      
      // If not found, try with response sender ID (might be different format)
      if (!ephemeralPrivateKey && responseSenderId) {
        console.log('🔍 Trying with response sender ID:', responseSenderId);
        ephemeralPrivateKey = ephemeralPrivateKeysRef.current.get(responseSenderId);
      }
      
      // Try all keys in the map if still not found (fallback)
      if (!ephemeralPrivateKey && ephemeralPrivateKeysRef.current.size > 0) {
        console.log('🔍 Trying first available key as fallback');
        ephemeralPrivateKey = Array.from(ephemeralPrivateKeysRef.current.values())[0];
      }
      
      if (!ephemeralPrivateKey) {
        console.error('❌ Ephemeral key not found in state');
        console.error('Stored recipientId:', storedRecipientId);
        console.error('Response senderId:', responseSenderId);
        console.error('Map contents:', Array.from(ephemeralPrivateKeysRef.current.entries()));
        setError('Ephemeral private key not found. Please click "Establish Secure Connection" again.');
        setStatus('idle');
        return;
      }
      
      console.log('✅ Ephemeral key found!');
      
      // Process response and derive session key
      const result = await processResponseMessage(
        responseMessage,
        initMessage,
        ephemeralPrivateKey,
        longTermPrivateKey
      );

      if (result && result.sessionKey) {
        console.log('✅ Session key derived successfully!');
        setSessionKey(result.sessionKey);
        setStatus('confirming');
        
        // Store session key temporarily for confirmation verification
        // Note: We can't store CryptoKey in localStorage, so we'll keep it in state
        
        // Send confirmation
        const confirmMessage = await createConfirmationMessage(
          result.sessionKey,
          result.nonceBob,
          currentUserId,
          storedRecipientId
        );
        
        // Send via Socket.io and HTTP
        socketService.sendKeyExchangeMessage({
          ...confirmMessage,
          type: 'confirm',
          receiverId: storedRecipientId,
        });
        
        await keyExchangeAPI.sendConfirm(confirmMessage);
        
        setStatus('established');
        onKeyExchangeComplete(result.sessionKey);
        console.log('✅ Key exchange completed!');
      } else {
        console.error('❌ Failed to derive session key from response');
        setError('Failed to derive session key. Please try again.');
        setStatus('idle');
      }
    } catch (err) {
      console.error('Error processing response:', err);
      setError('Failed to process response: ' + err.message);
      setStatus('idle');
    }
  };

  // Handle init message (when someone initiates with us)
  const handleInitMessage = async (initMessage) => {
    try {
      // Only respond if this is for us
      if (initMessage.receiverId !== currentUserId) {
        console.log('Init message not for us, ignoring. receiverId:', initMessage.receiverId, 'currentUserId:', currentUserId);
        return;
      }

      // If we're already in "initiated" state, we both initiated - cancel ours and respond to theirs
      if (status === 'initiated') {
        console.log('Both users initiated. Cancelling our init and responding to theirs.');
        // Clear our init state
        localStorage.removeItem('keyExchange_init');
        ephemeralPrivateKeysRef.current.delete(recipientId);
      }

      // Check if keys are loaded
      if (!longTermPrivateKey || !longTermPublicKey) {
        console.error('Keys not loaded yet, cannot respond to init message');
        setError('Keys not loaded. Please refresh the page and try again.');
        return;
      }

      setStatus('responding');
      
      // Create response
      const responseMessage = await createResponseMessage(
        initMessage,
        currentUserId,
        longTermPrivateKey,
        longTermPublicKey
      );
      
      // Derive session key as responder (Bob)
      const derivedSessionKey = await deriveSessionKeyAsResponder(responseMessage, initMessage);
      console.log('✅ Session key derived as responder');
      
      // Store session key in state
      setSessionKey(derivedSessionKey);
      
      // Store response data for later confirmation (without private key)
      localStorage.setItem('keyExchange_response', JSON.stringify({
        message: {
          ...responseMessage,
          _ephemeralPrivateKey: undefined, // Can't serialize CryptoKey
        },
        initMessage: {
          ...initMessage,
        },
        senderId: initMessage.senderId,
        timestamp: Date.now(),
      }));
      
      // Store a reference to the session key for confirmation handling
      // We'll use a ref since CryptoKey can't be serialized
      sessionKeyRef.current = derivedSessionKey;
      
      // Send via Socket.io and HTTP
      socketService.sendKeyExchangeMessage({
        ...responseMessage,
        type: 'response',
        receiverId: initMessage.senderId,
        _ephemeralPrivateKey: undefined, // Don't send private key
      });
      
      await keyExchangeAPI.sendResponse({
        ...responseMessage,
        _ephemeralPrivateKey: undefined,
      });
      
      setStatus('responded');
    } catch (err) {
      console.error('Error handling init message:', err);
      setError('Failed to respond: ' + err.message);
      setStatus('idle');
    }
  };

  // Handle confirm message
  const handleConfirmMessage = async (confirmMessage) => {
    try {
      const storedResponse = localStorage.getItem('keyExchange_response');
      if (!storedResponse) {
        console.error('No stored response message found');
        return;
      }

      const { message: responseMessage, senderId } = JSON.parse(storedResponse);
      
      // Get session key from ref (stored during handleInitMessage)
      const storedSessionKey = sessionKeyRef.current || sessionKey;
      
      if (!storedSessionKey) {
        console.error('No session key found for confirmation');
        setError('Session key not found. Please restart key exchange.');
        return;
      }
      
      // Verify confirmation
      const verified = await verifyConfirmationMessage(
        confirmMessage,
        storedSessionKey,
        responseMessage.nonceBob
      );
      
      if (verified) {
        console.log('✅ Key confirmation verified!');
        setSessionKey(storedSessionKey);
        setStatus('established');
        onKeyExchangeComplete(storedSessionKey);
        
        // Send acknowledgment
        const ackMessage = await createAcknowledgmentMessage(
          storedSessionKey,
          responseMessage.nonceBob,
          currentUserId,
          senderId
        );
        
        socketService.sendKeyExchangeMessage({
          ...ackMessage,
          type: 'acknowledge',
          receiverId: senderId,
        });
        
        await keyExchangeAPI.sendAck(ackMessage);
        console.log('✅ Key exchange completed (responder side)!');
      } else {
        console.error('❌ Key confirmation verification failed');
        setError('Key confirmation failed. Please restart key exchange.');
      }
    } catch (err) {
      console.error('Error handling confirm message:', err);
      setError('Failed to verify confirmation: ' + err.message);
    }
  };

  // Handle acknowledge message
  const handleAcknowledgeMessage = async (ackMessage) => {
    try {
      setStatus('established');
      console.log('✅ Key exchange completed!');
    } catch (err) {
      console.error('Error handling acknowledge message:', err);
    }
  };

  // Initiate key exchange
  const handleInitiate = async () => {
    // Prevent connecting to yourself
    if (currentUserId === recipientId) {
      setError('❌ Cannot establish connection with yourself! Please select a different user.');
      return;
    }

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

      // Send to server via HTTP (for persistence) and Socket.io (for real-time)
      await keyExchangeAPI.sendInit(initMessage);
      
      // Also send via Socket.io for real-time delivery
      socketService.sendKeyExchangeMessage({
        ...initMessage,
        type: 'init',
        receiverId: recipientId,
      });

      // Store ephemeral private key in ref (persists across re-renders)
      // This is critical - we need this key to process the response
      if (initMessage._ephemeralPrivateKey) {
        console.log('💾 Storing ephemeral private key for recipient:', recipientId);
        ephemeralPrivateKeysRef.current.set(recipientId, initMessage._ephemeralPrivateKey);
        console.log('💾 Ephemeral key stored. Map size:', ephemeralPrivateKeysRef.current.size);
      } else {
        console.error('❌ No ephemeral private key in init message!');
        setError('Failed to store ephemeral key. Please try again.');
        setStatus('idle');
        return;
      }
      
      // Store init message data for later use (without private key)
      const initData = {
        message: {
          ...initMessage,
          _ephemeralPrivateKey: undefined, // Can't serialize CryptoKey
        },
        recipientId,
        timestamp: Date.now(),
      };
      
      localStorage.setItem('keyExchange_init', JSON.stringify(initData));
      console.log('💾 Init message stored in localStorage');

      setStatus('initiated');
    } catch (err) {
      setError('Failed to initiate key exchange: ' + err.message);
      setStatus('idle');
    }
  };

  // Reset function to clear stuck state
  const handleReset = () => {
    setStatus('idle');
    setError('');
    setSessionKey(null);
    sessionKeyRef.current = null;
    localStorage.removeItem('keyExchange_init');
    localStorage.removeItem('keyExchange_response');
    ephemeralPrivateKeysRef.current.clear();
    console.log('🔄 Key exchange state reset');
  };

  // Check if user is trying to connect to themselves
  const isSelfConnection = currentUserId === recipientId;

  return (
    <div className="key-exchange-manager">
      <h3>Key Exchange with {recipientUsername}</h3>
      
      {isSelfConnection && (
        <div className="error-message" style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <strong>Error:</strong> You cannot establish a connection with yourself. Please click "Change User" and select a different user.
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="key-exchange-status">
        Status: <strong>{status}</strong>
        {sessionKey && <span className="success">Session key established</span>}
      </div>
      
      {status === 'idle' && (
        <>
          {!keysLoaded && !keysLoading && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={loadKeys} className="btn-primary" disabled={keysLoading}>
                {keysLoading ? 'Loading Keys...' : 'Load Keys'}
              </button>
              {showRegenerateOption && (
                <button onClick={regenerateKeys} className="btn-secondary" disabled={keysLoading} style={{ background: '#ff9800', color: 'white' }}>
                  Regenerate Keys
                </button>
              )}
            </div>
          )}
          {keysLoaded && (
            <button 
              onClick={handleInitiate} 
              className="btn-primary"
              disabled={isSelfConnection}
              title={isSelfConnection ? 'Cannot connect to yourself' : ''}
            >
              Establish Secure Connection
            </button>
          )}
        </>
      )}
      
      {status === 'initiated' && (
        <div className="waiting">
          Waiting for response from {recipientUsername}...
          <button onClick={handleReset} className="btn-secondary" style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}>
            Reset
          </button>
        </div>
      )}
      
      {sessionKey && (
        <div className="success-message">
          Secure channel established. You can now send encrypted messages.
        </div>
      )}
    </div>
  );
};

export default KeyExchangeManager;

