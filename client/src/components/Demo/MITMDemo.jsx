/**
 * MITM Attack Demonstration Component
 * Shows how MITM attacks work when signatures are disabled
 */

import React, { useState, useEffect } from 'react';
import './MITMDemo.css';

const MITMDemo = ({ isVulnerableMode }) => {
  const [attackerKeys, setAttackerKeys] = useState(null);
  const [interceptedMessages, setInterceptedMessages] = useState([]);
  const [attackStatus, setAttackStatus] = useState('idle');
  const [showDemo, setShowDemo] = useState(false);

  // Generate attacker's ECDH key pair
  const generateAttackerKeys = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        true,
        ['deriveKey', 'deriveBits']
      );

      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      
      setAttackerKeys({
        publicKey: publicKeyJwk,
        privateKey: keyPair.privateKey,
      });

      // Store globally for interception
      window.attackerKeys = {
        publicKey: publicKeyJwk,
        privateKey: keyPair.privateKey,
      };

      console.log('🔓 Attacker keys generated:', publicKeyJwk);
      setAttackStatus('keys_ready');
    } catch (error) {
      console.error('Failed to generate attacker keys:', error);
    }
  };

  // Simulate intercepting a message
  const interceptMessage = (message, type) => {
    const intercepted = {
      id: Date.now(),
      type,
      original: { ...message },
      modified: null,
      timestamp: new Date().toISOString(),
    };

    // If we have attacker keys, show how we'd modify the message
    if (attackerKeys && message.senderECDHPublic) {
      intercepted.modified = {
        ...message,
        senderECDHPublic: attackerKeys.publicKey,
      };
    }

    setInterceptedMessages(prev => [...prev, intercepted]);
    return intercepted;
  };

  // Clear demo state
  const clearDemo = () => {
    setInterceptedMessages([]);
    setAttackStatus('idle');
    setAttackerKeys(null);
    window.attackerKeys = null;
  };

  if (!showDemo) {
    return (
      <div className="mitm-demo-toggle">
        <button onClick={() => setShowDemo(true)} className="btn-demo">
          🔓 Show MITM Attack Demo
        </button>
      </div>
    );
  }

  return (
    <div className="mitm-demo">
      <div className="mitm-header">
        <h3>🔓 MITM Attack Demonstration</h3>
        <button onClick={() => setShowDemo(false)} className="btn-close">×</button>
      </div>

      <div className="mitm-status">
        <div className={`mode-indicator ${isVulnerableMode ? 'vulnerable' : 'protected'}`}>
          {isVulnerableMode ? (
            <>⚠️ VULNERABLE MODE - Signatures Disabled</>
          ) : (
            <>🔒 PROTECTED MODE - Signatures Enabled</>
          )}
        </div>
      </div>

      <div className="mitm-explanation">
        <h4>How MITM Attack Works:</h4>
        <ol>
          <li><strong>Intercept:</strong> Attacker intercepts key exchange messages</li>
          <li><strong>Replace:</strong> Attacker replaces public keys with their own</li>
          <li><strong>Relay:</strong> Both parties think they're talking to each other</li>
          <li><strong>Decrypt:</strong> Attacker can decrypt all messages</li>
        </ol>
      </div>

      <div className="mitm-controls">
        <h4>Attack Controls:</h4>
        
        <div className="control-group">
          <button 
            onClick={generateAttackerKeys} 
            disabled={attackerKeys !== null}
            className="btn-attack"
          >
            1. Generate Attacker Keys
          </button>
          {attackerKeys && (
            <span className="status-check">✅ Keys Ready</span>
          )}
        </div>

        {attackerKeys && (
          <div className="attacker-key-display">
            <h5>Attacker's Public Key:</h5>
            <pre>{JSON.stringify(attackerKeys.publicKey, null, 2)}</pre>
            <p className="hint">
              In a real attack, this key would replace the victim's key in intercepted messages.
            </p>
          </div>
        )}

        <div className="control-group">
          <button onClick={clearDemo} className="btn-reset">
            Reset Demo
          </button>
        </div>
      </div>

      {interceptedMessages.length > 0 && (
        <div className="intercepted-messages">
          <h4>Intercepted Messages:</h4>
          {interceptedMessages.map(msg => (
            <div key={msg.id} className="intercepted-message">
              <div className="msg-type">{msg.type}</div>
              <div className="msg-time">{msg.timestamp}</div>
              <div className="msg-content">
                <strong>Original ECDH Key:</strong>
                <pre>{JSON.stringify(msg.original.senderECDHPublic, null, 2)}</pre>
              </div>
              {msg.modified && (
                <div className="msg-modified">
                  <strong>⚠️ Modified with Attacker's Key:</strong>
                  <pre>{JSON.stringify(msg.modified.senderECDHPublic, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mitm-defense">
        <h4>🛡️ How Signatures Prevent MITM:</h4>
        <ul>
          <li>Each message is signed with sender's private key</li>
          <li>Receiver verifies signature with sender's public key</li>
          <li>If attacker modifies the message, signature becomes invalid</li>
          <li>Attack is detected and connection is rejected</li>
        </ul>
      </div>

      <div className="demo-instructions">
        <h4>📋 To Demonstrate the Attack:</h4>
        <ol>
          <li>Switch to vulnerable mode: <code>node scripts/switch-mitm-version.js vulnerable</code></li>
          <li>Restart the client</li>
          <li>Open two browser windows (or use incognito)</li>
          <li>Register/login as two different users</li>
          <li>Use a proxy tool (BurpSuite) to intercept key exchange</li>
          <li>Replace the ECDH public key with attacker's key</li>
          <li>Observe that connection succeeds (vulnerable)</li>
          <li>Switch back to protected mode and repeat - attack fails!</li>
        </ol>
      </div>
    </div>
  );
};

export default MITMDemo;
