(async function() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const pub = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  console.log(' ATTACKER KEY - COPY THIS:');
  console.log(JSON.stringify(pub));
})();