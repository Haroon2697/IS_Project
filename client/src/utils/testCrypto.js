/**
 * Crypto Testing Utilities
 * Run these in browser console to test cryptographic features
 */

// Test key generation
window.testKeyGeneration = async function() {
  console.log('🧪 Testing Key Generation...');
  try {
    const { generateKeyPair, exportPublicKey } = await import('../crypto/keyManagement');
    
    const keyPair = await generateKeyPair();
    console.log('✅ Key pair generated');
    
    const publicKey = await exportPublicKey(keyPair.publicKey);
    console.log('✅ Public key exported:', publicKey);
    
    return { keyPair, publicKey };
  } catch (error) {
    console.error('❌ Key generation failed:', error);
    throw error;
  }
};

// Test encryption/decryption
window.testEncryption = async function() {
  console.log('🧪 Testing Encryption...');
  try {
    const { encryptMessage, decryptMessage } = await import('../crypto/encryption');
    
    // Generate test key
    const testKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    const plaintext = 'Hello, this is a secret message!';
    console.log('📝 Plaintext:', plaintext);
    
    // Encrypt
    const encrypted = await encryptMessage(testKey, plaintext);
    console.log('🔒 Encrypted:', encrypted);
    console.log('   Ciphertext:', encrypted.ciphertext.substring(0, 50) + '...');
    console.log('   IV:', encrypted.iv);
    console.log('   Auth Tag:', encrypted.authTag);
    
    // Decrypt
    const decrypted = await decryptMessage(testKey, encrypted.ciphertext, encrypted.iv, encrypted.authTag);
    console.log('🔓 Decrypted:', decrypted);
    
    if (decrypted === plaintext) {
      console.log('✅ Encryption/Decryption test PASSED!');
    } else {
      console.error('❌ Decrypted text does not match!');
    }
    
    return { encrypted, decrypted };
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    throw error;
  }
};

// Test key exchange (simplified)
window.testKeyExchange = async function() {
  console.log('🧪 Testing Key Exchange...');
  try {
    const { generateECDHKeyPair, exportPublicKey, importECDHPublicKey } = await import('../crypto/keyManagement');
    const { deriveSharedSecret } = await import('../crypto/keyExchange');
    const { deriveSessionKey } = await import('../crypto/keyDerivation');
    
    // Generate two key pairs (simulating Alice and Bob)
    console.log('Generating Alice\'s key pair...');
    const aliceKeyPair = await generateECDHKeyPair();
    const alicePublic = await exportPublicKey(aliceKeyPair.publicKey);
    
    console.log('Generating Bob\'s key pair...');
    const bobKeyPair = await generateECDHKeyPair();
    const bobPublic = await exportPublicKey(bobKeyPair.publicKey);
    
    // Alice derives shared secret
    console.log('Alice deriving shared secret...');
    const bobPublicKey = await importECDHPublicKey(bobPublic);
    const aliceSharedSecret = await deriveSharedSecret(aliceKeyPair.privateKey, bobPublicKey);
    
    // Bob derives shared secret
    console.log('Bob deriving shared secret...');
    const alicePublicKey = await importECDHPublicKey(alicePublic);
    const bobSharedSecret = await deriveSharedSecret(bobKeyPair.privateKey, alicePublicKey);
    
    // Derive session keys
    console.log('Deriving session keys...');
    const aliceSessionKey = await deriveSessionKey(aliceSharedSecret, 'test-salt', 'alice', 'bob');
    const bobSessionKey = await deriveSessionKey(bobSharedSecret, 'test-salt', 'alice', 'bob');
    
    console.log('✅ Key exchange test completed!');
    console.log('   Both parties should have the same session key');
    
    return { aliceSessionKey, bobSessionKey };
  } catch (error) {
    console.error('❌ Key exchange test failed:', error);
    throw error;
  }
};

// Test signatures
window.testSignatures = async function() {
  console.log('🧪 Testing Digital Signatures...');
  try {
    const { generateKeyPair, exportPublicKey, importPublicKey } = await import('../crypto/keyManagement');
    const { createSignature, verifySignature } = await import('../crypto/signatures');
    
    // Generate key pair
    const keyPair = await generateKeyPair();
    const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
    const publicKey = await importPublicKey(publicKeyJwk);
    
    // Create signature
    const message = 'This is a test message to sign';
    const signature = await createSignature(keyPair.privateKey, message);
    console.log('✅ Signature created:', signature.substring(0, 50) + '...');
    
    // Verify signature
    const isValid = await verifySignature(publicKey, message, signature);
    console.log('✅ Signature valid:', isValid);
    
    // Test invalid signature
    const invalidMessage = 'This is a different message';
    const isValid2 = await verifySignature(publicKey, invalidMessage, signature);
    console.log('✅ Invalid signature rejected:', !isValid2);
    
    if (isValid && !isValid2) {
      console.log('✅ Signature test PASSED!');
    } else {
      console.error('❌ Signature test FAILED!');
    }
    
    return { signature, isValid };
  } catch (error) {
    console.error('❌ Signature test failed:', error);
    throw error;
  }
};

// Run all tests
window.runAllTests = async function() {
  console.log('🚀 Running All Cryptographic Tests...\n');
  
  try {
    await window.testKeyGeneration();
    console.log('\n');
    
    await window.testEncryption();
    console.log('\n');
    
    await window.testKeyExchange();
    console.log('\n');
    
    await window.testSignatures();
    console.log('\n');
    
    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
};

console.log(`
🧪 Crypto Testing Functions Loaded!

Available tests:
- testKeyGeneration()    - Test ECC key pair generation
- testEncryption()        - Test AES-256-GCM encryption
- testKeyExchange()       - Test ECDH key exchange
- testSignatures()        - Test ECDSA signatures
- runAllTests()           - Run all tests

Open browser console and run: runAllTests()
`);

