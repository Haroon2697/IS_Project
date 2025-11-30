import React, { useState, useEffect, useRef } from 'react';
import { createInitMessage, processInitMessage, createResponseMessage, processResponseMessage, createConfirmationMessage, verifyConfirmationMessage, createAcknowledgmentMessage } from '../../crypto/keyExchange';
import { retrievePrivateKey, importPublicKey } from '../../crypto/keyManagement';
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
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysLoaded, setKeysLoaded] = useState(false);

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

      // Use setTimeout to avoid React concurrent rendering issues with prompt()
      const password = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(prompt('Enter your password to load keys:'));
        }, 100);
      });
      
      if (!password) {
        setKeysLoading(false);
        setError('Password required to load keys');
        return;
      }
      
      console.log('🔑 Loading keys...');
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
      setError('Failed to load keys: ' + err.message);
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
        } else if (message.type === 'init' || message.messageType === 'init') {
          // This is an init from someone else - we should respond
          // Check if keys are loaded first
          if (!longTermPrivateKey || !longTermPublicKey) {
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
        return;
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
      
      // Store response data for later confirmation
      localStorage.setItem('keyExchange_response', JSON.stringify({
        message: responseMessage,
        senderId: initMessage.senderId,
        timestamp: Date.now(),
      }));
      
      // Send via Socket.io and HTTP
      socketService.sendKeyExchangeMessage({
        ...responseMessage,
        type: 'response',
        receiverId: initMessage.senderId,
      });
      
      await keyExchangeAPI.sendResponse(responseMessage);
      
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
      
      // We need to derive the session key from the response
      // This is complex - for now, we'll need to store it during response processing
      // For simplicity, let's check if we have a session key stored
      const storedSessionKey = localStorage.getItem('keyExchange_sessionKey');
      
      if (storedSessionKey) {
        // Verify confirmation
        const verified = await verifyConfirmationMessage(
          confirmMessage,
          storedSessionKey, // This should be the actual CryptoKey
          responseMessage.nonceBob
        );
        
        if (verified) {
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
        }
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

  return (
    <div className="key-exchange-manager">
      <h3>Key Exchange with {recipientUsername}</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="key-exchange-status">
        Status: <strong>{status}</strong>
        {sessionKey && <span className="success"> ✅ Session key established</span>}
      </div>
      
      {status === 'idle' && (
        <>
          {!keysLoaded && !keysLoading && (
            <button onClick={loadKeys} className="btn-primary" disabled={keysLoading}>
              {keysLoading ? 'Loading Keys...' : 'Load Keys'}
            </button>
          )}
          {keysLoaded && (
            <button onClick={handleInitiate} className="btn-primary">
              Establish Secure Connection
            </button>
          )}
        </>
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

