#!/usr/bin/env node

/**
 * MITM Attack Test Script
 * 
 * This script helps verify that the MITM attack implementation is working correctly.
 * It tests both vulnerable and protected versions.
 */

const fs = require('fs');
const path = require('path');

const CRYPTO_DIR = path.join(__dirname, 'client/src/crypto');
const KEY_EXCHANGE_FILE = path.join(CRYPTO_DIR, 'keyExchange.js');
const VULNERABLE_FILE = path.join(CRYPTO_DIR, 'keyExchange.vulnerable.js');
const BACKUP_FILE = path.join(CRYPTO_DIR, 'keyExchange.backup.js');

console.log('🔍 MITM Attack Test Suite\n');
console.log('='.repeat(60));

// Test 1: Check if vulnerable version exists
console.log('\n📋 Test 1: Checking vulnerable version file...');
if (fs.existsSync(VULNERABLE_FILE)) {
  console.log('✅ Vulnerable version file exists: keyExchange.vulnerable.js');
  
  const vulnerableContent = fs.readFileSync(VULNERABLE_FILE, 'utf8');
  const hasVulnerableMarkers = 
    vulnerableContent.includes('VULNERABLE MODE') ||
    vulnerableContent.includes('Signature verification DISABLED') ||
    vulnerableContent.includes('// VULNERABLE:');
  
  if (hasVulnerableMarkers) {
    console.log('✅ Vulnerable version contains expected markers');
  } else {
    console.log('⚠️  Warning: Vulnerable version may not have expected markers');
  }
} else {
  console.log('❌ Vulnerable version file NOT found!');
  process.exit(1);
}

// Test 2: Check if backup (protected) version exists
console.log('\n📋 Test 2: Checking protected version file...');
if (fs.existsSync(BACKUP_FILE)) {
  console.log('✅ Protected version backup exists: keyExchange.backup.js');
  
  const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
  const hasSignatureImport = backupContent.includes('import { createSignature, verifySignature }');
  const hasSignatureCreation = backupContent.includes('createSignature');
  const hasSignatureVerification = backupContent.includes('verifySignature');
  
  if (hasSignatureImport && hasSignatureCreation && hasSignatureVerification) {
    console.log('✅ Protected version has signature implementation');
  } else {
    console.log('⚠️  Warning: Protected version may be missing signature code');
  }
} else {
  console.log('❌ Protected version backup NOT found!');
  process.exit(1);
}

// Test 3: Check current version status
console.log('\n📋 Test 3: Checking current version status...');
if (fs.existsSync(KEY_EXCHANGE_FILE)) {
  const currentContent = fs.readFileSync(KEY_EXCHANGE_FILE, 'utf8');
  const isVulnerable = 
    currentContent.includes('VULNERABLE MODE') ||
    currentContent.includes('Signature verification DISABLED') ||
    currentContent.includes('// VULNERABLE:');
  
  if (isVulnerable) {
    console.log('📊 Current Status: VULNERABLE (Signatures DISABLED)');
    console.log('   ⚠️  This version allows MITM attacks');
  } else {
    console.log('📊 Current Status: PROTECTED (Signatures ENABLED)');
    console.log('   ✅ This version prevents MITM attacks');
  }
} else {
  console.log('❌ Current keyExchange.js file NOT found!');
  process.exit(1);
}

// Test 4: Verify key differences
console.log('\n📋 Test 4: Verifying key differences between versions...');
const vulnerableContent = fs.readFileSync(VULNERABLE_FILE, 'utf8');
const backupContent = fs.existsSync(BACKUP_FILE) ? fs.readFileSync(BACKUP_FILE, 'utf8') : '';

const vulnHasSignature = vulnerableContent.includes('createSignature(') && 
                         !vulnerableContent.includes('// VULNERABLE: Signature creation is COMMENTED OUT');
const protHasSignature = backupContent.includes('createSignature(') && 
                         backupContent.includes('verifySignature(');

console.log(`   Vulnerable version has signatures: ${vulnHasSignature ? '❌ YES (should be NO)' : '✅ NO (correct)'}`);
console.log(`   Protected version has signatures: ${protHasSignature ? '✅ YES (correct)' : '❌ NO (should be YES)'}`);

// Test 5: Check switch script
console.log('\n📋 Test 5: Checking version switcher script...');
const switchScript = path.join(__dirname, 'scripts/switch-mitm-version.js');
if (fs.existsSync(switchScript)) {
  console.log('✅ Version switcher script exists');
} else {
  console.log('❌ Version switcher script NOT found!');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY\n');

const allTestsPass = 
  fs.existsSync(VULNERABLE_FILE) &&
  fs.existsSync(BACKUP_FILE) &&
  fs.existsSync(KEY_EXCHANGE_FILE) &&
  fs.existsSync(switchScript);

if (allTestsPass) {
  console.log('✅ All basic tests passed!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Start the server: cd server && npm start');
  console.log('   2. Start the client: cd client && npm start');
  console.log('   3. Follow MITM_DEMO_STEPS.md for manual testing');
  console.log('   4. Use BurpSuite to intercept and modify key exchange messages');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Vulnerable version: Attack should SUCCEED');
  console.log('   - Protected version: Attack should FAIL');
  console.log('   - Always restore protected version after testing!');
} else {
  console.log('❌ Some tests failed. Please check the errors above.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));

