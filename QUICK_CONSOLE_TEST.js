/**
 * Quick Console Test - Copy and paste this into browser console
 * Make sure you're on http://localhost:3000/dashboard and logged in
 */

(async function testEncryption() {
  try {
    console.log('🧪 Starting Encryption Test...\n');
    
    // Import encryption functions
    const encryptionModule = await import('./src/crypto/encryption.js');
    const { encryptMessage, decryptMessage } = encryptionModule;
    
    console.log('🔑 Generating test key...');
    const testKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    const plaintext = "Hello, secret message!";
    console.log('📝 Plaintext:', plaintext);
    
    console.log('🔒 Encrypting...');
    const encrypted = await encryptMessage(testKey, plaintext);
    console.log('🔒 Encrypted:', {
      ciphertext: encrypted.ciphertext.substring(0, 50) + '...',
      iv: encrypted.iv,
      authTag: encrypted.authTag
    });
    
    console.log('🔓 Decrypting...');
    const decrypted = await decryptMessage(
      testKey,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag
    );
    console.log('🔓 Decrypted:', decrypted);
    
    if (decrypted === plaintext) {
      console.log('\n✅ Encryption test PASSED!');
    } else {
      console.log('\n❌ Encryption test FAILED - decrypted text does not match');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure you are logged in');
    console.log('   2. Make sure you are on http://localhost:3000/dashboard');
    console.log('   3. Check if the path to encryption.js is correct');
    console.log('   4. Try Option 3 (simple test) from HOW_TO_TEST.md');
  }
})();

