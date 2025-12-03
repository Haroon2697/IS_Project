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

        const plaintext = await messagingService.decryptMessage(encryptedMessage);
        
        // Skip duplicate messages (null returned from decryptMessage)
        if (plaintext === null) {
          console.log('Replay attack blocked: duplicate message detected by replay protection');
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
            <span className="secure-indicator">Secure</span>
          ) : (
            <span className="insecure-indicator">Not Secure</span>
          )}
          {socketService.isReady() ? (
            <span className="connection-indicator" title="Connected">Connected</span>
          ) : (
            <span className="connection-indicator" title="Disconnected">Disconnected</span>
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

