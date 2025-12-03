import React, { useState, useEffect, useRef } from 'react';
import messagingService from '../../services/messaging';
import socketService from '../../services/socketService';
import FileUpload from '../Files/FileUpload';
import FileList from '../Files/FileList';
import './Chat.css';

// Import socketService at module level for status check

const ChatWindow = ({ recipientId, recipientUsername, sessionKey }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showFiles, setShowFiles] = useState(false);
  const [fileListKey, setFileListKey] = useState(0); // Force re-render
  const [lastEncryptedMessage, setLastEncryptedMessage] = useState(null);
  const [replayResult, setReplayResult] = useState('');
  const messagesEndRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const currentUserId = user?.id;

  useEffect(() => {
    // Connect to Socket.io on mount
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }

    // Set up message listener
    const handleReceive = async (encryptedMessage) => {
      try {
        // Only process messages for this recipient
        if (encryptedMessage.senderId !== recipientId) {
          return;
        }

        // Store the encrypted message for replay demo
        setLastEncryptedMessage({...encryptedMessage});
        console.log('📦 Message captured for replay demo');
        
        const plaintext = await messagingService.decryptMessage(encryptedMessage);
        
        // Skip duplicate messages (null returned from decryptMessage)
        if (plaintext === null) {
          console.log('⚠️ Skipping duplicate message - REPLAY PROTECTION WORKING');
          return;
        }
        
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: plaintext,
          senderId: encryptedMessage.senderId,
          timestamp: new Date(encryptedMessage.timestamp),
          encrypted: encryptedMessage,
        }]);
      } catch (err) {
        console.error('Failed to decrypt message:', err);
        setError('Failed to decrypt message: ' + err.message);
      }
    };

    socketService.onMessage(handleReceive);

    // Cleanup on unmount
    return () => {
      socketService.offMessage(handleReceive);
    };
  }, [recipientId]);

  useEffect(() => {
    if (sessionKey) {
      messagingService.setSessionKey(recipientId, sessionKey);
    }
  }, [sessionKey, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionKey) return;

    setSending(true);
    setError('');

    try {
      // Encrypt message
      const encryptedMessage = await messagingService.encryptMessage(
        recipientId,
        inputMessage
      );

      // Add to local messages (optimistic update)
      const user = JSON.parse(localStorage.getItem('user'));
      const messageId = Date.now();
      setMessages(prev => [...prev, {
        id: messageId,
        text: inputMessage,
        senderId: user.id,
        timestamp: new Date(),
        encrypted: encryptedMessage,
      }]);

      // Send via Socket.io
      const sent = socketService.sendMessage({
        ...encryptedMessage,
        messageId,
      });

      if (!sent) {
        setError('Failed to send message - not connected');
        // Remove optimistic update if send failed
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }

      setInputMessage('');
    } catch (err) {
      setError('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleReceive = async (encryptedMessage) => {
    try {
      const plaintext = await messagingService.decryptMessage(encryptedMessage);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: plaintext,
        senderId: encryptedMessage.senderId,
        timestamp: new Date(encryptedMessage.timestamp),
        encrypted: encryptedMessage,
      }]);
    } catch (err) {
      setError('Failed to decrypt message: ' + err.message);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{recipientUsername}</h3>
        <div className="status-indicators">
          {sessionKey ? (
            <span className="secure-indicator">🔒 Secure</span>
          ) : (
            <span className="insecure-indicator">⚠️ Not Secure</span>
          )}
          {socketService.isReady() ? (
            <span className="connection-indicator" title="Connected">🟢</span>
          ) : (
            <span className="connection-indicator" title="Disconnected">🔴</span>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const user = JSON.parse(localStorage.getItem('user'));
            const isOwn = msg.senderId === user.id;
            
            return (
              <div key={msg.id} className={`message ${isOwn ? 'own' : 'other'}`}>
                <div className="message-content">{msg.text}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Replay Attack Demo Section - Only visible in development for project demonstration */}
      {process.env.NODE_ENV === 'development' && (
      <div className="replay-demo-section" style={{ 
        padding: '10px', 
        margin: '10px 0', 
        background: '#fff3e0', 
        borderRadius: '8px',
        border: '1px solid #ff9800'
      }}>
        <strong>🔬 Replay Attack Demo (Dev Only)</strong>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
          {lastEncryptedMessage 
            ? '✅ Message captured! Click button to simulate replay attack.' 
            : '⏳ Waiting for a message to capture...'}
        </p>
        <button
          onClick={async () => {
            if (!lastEncryptedMessage) {
              setReplayResult('❌ No message captured yet. Receive a message first.');
              return;
            }
            setReplayResult('🔄 Attempting replay attack...');
            try {
              const result = await messagingService.decryptMessage(lastEncryptedMessage);
              if (result === null) {
                setReplayResult('🛡️ REPLAY BLOCKED! Message detected as duplicate.');
                console.log('🛡️ REPLAY ATTACK BLOCKED - Duplicate nonce/sequence detected');
              } else {
                setReplayResult('⚠️ Message decrypted (first time processing)');
              }
            } catch (err) {
              setReplayResult('🛡️ REPLAY BLOCKED! ' + err.message);
              console.log('🛡️ REPLAY ATTACK BLOCKED:', err.message);
            }
          }}
          disabled={!lastEncryptedMessage}
          style={{
            padding: '8px 16px',
            background: lastEncryptedMessage ? '#f44336' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: lastEncryptedMessage ? 'pointer' : 'not-allowed',
            marginRight: '10px'
          }}
        >
          🔴 Simulate Replay Attack
        </button>
        {replayResult && (
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            background: replayResult.includes('BLOCKED') ? '#e8f5e9' : '#ffebee',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            {replayResult}
          </div>
        )}
      </div>
      )}

      {/* File Sharing Section */}
      <div className="file-sharing-section">
        <button
          type="button"
          onClick={() => setShowFiles(!showFiles)}
          className="toggle-files-btn"
        >
          {showFiles ? '▼' : '▶'} Files
        </button>
        
        {showFiles && (
          <div className="files-panel">
            <FileUpload
              recipientId={recipientId}
              sessionKey={sessionKey}
              onUploadComplete={(fileId) => {
                console.log('File uploaded:', fileId);
                // Refresh file list
                setFileListKey(prev => prev + 1);
              }}
            />
            <FileList
              key={fileListKey}
              recipientId={recipientId}
              sessionKey={sessionKey}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="message-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={sessionKey ? "Type a message..." : "Establish secure connection first"}
          disabled={!sessionKey || sending}
          className="message-input"
        />
        <button
          type="submit"
          disabled={!sessionKey || sending || !inputMessage.trim()}
          className="send-button"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

