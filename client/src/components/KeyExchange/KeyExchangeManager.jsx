import React, { useState, useEffect } from 'react';
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
  const [ephemeralPrivateKeys, setEphemeralPrivateKeys] = useState(new Map());

  // Initialize: Get user's keys and connect Socket.io
  useEffect(() => {
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
          await handleInitMessage(message);
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
  }, [currentUserId, recipientId]);

  // Handle response message
  const handleResponseMessage = async (responseMessage) => {
    try {
      const storedInit = localStorage.getItem('keyExchange_init');
      if (!storedInit) {
        console.error('No stored init message found');
        return;
      }

      const { message: initMessage } = JSON.parse(storedInit);
      
      // Get ephemeral private key from component state
      const ephemeralPrivateKey = ephemeralPrivateKeys.get(recipientId);
      
      if (!ephemeralPrivateKey) {
        setError('Ephemeral private key not found. Please restart key exchange.');
        return;
      }
      
      // Process response and derive session key
      const result = await processResponseMessage(
        responseMessage,
        initMessage,
        ephemeralPrivateKey,
        longTermPrivateKey
      );

      if (result && result.sessionKey) {
        setSessionKey(result.sessionKey);
        setStatus('confirming');
        
        // Send confirmation
        const confirmMessage = await createConfirmationMessage(
          result.sessionKey,
          result.nonceBob,
          currentUserId,
          recipientId
        );
        
        // Send via Socket.io and HTTP
        socketService.sendKeyExchangeMessage({
          ...confirmMessage,
          type: 'confirm',
          receiverId: recipientId,
        });
        
        await keyExchangeAPI.sendConfirm(confirmMessage);
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

      // Store ephemeral private key in component state
      if (initMessage._ephemeralPrivateKey) {
        setEphemeralPrivateKeys(prev => {
          const newMap = new Map(prev);
          newMap.set(recipientId, initMessage._ephemeralPrivateKey);
          return newMap;
        });
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

