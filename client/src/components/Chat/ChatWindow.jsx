import React, { useState, useEffect, useRef } from 'react';
import messagingService from '../../services/messaging';
import './Chat.css';

const ChatWindow = ({ recipientId, recipientUsername, sessionKey }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

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
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: inputMessage,
        senderId: user.id,
        timestamp: new Date(),
        encrypted: encryptedMessage,
      }]);

      // TODO: Send to server/WebSocket
      console.log('Encrypted message:', encryptedMessage);

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
        {sessionKey ? (
          <span className="secure-indicator">🔒 Secure</span>
        ) : (
          <span className="insecure-indicator">⚠️ Not Secure</span>
        )}
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

