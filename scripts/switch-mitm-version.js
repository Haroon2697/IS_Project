#!/usr/bin/env node

/**
 * Script to switch between vulnerable and protected versions
 * for MITM attack demonstration
 */

const fs = require('fs');
const path = require('path');

const CRYPTO_DIR = path.join(__dirname, '../client/src/crypto');
const CONFIG_DIR = path.join(__dirname, '../client/src/config');
const ORIGINAL_FILE = path.join(CRYPTO_DIR, 'keyExchange.js');
const BACKUP_FILE = path.join(CRYPTO_DIR, 'keyExchange.backup.js');
const VULNERABLE_FILE = path.join(CRYPTO_DIR, 'keyExchange.vulnerable.js');
const CONFIG_FILE = path.join(CONFIG_DIR, 'securityMode.js');

// Update the security mode config file
function updateSecurityModeConfig(mode) {
  const configContent = `/**
 * Security Mode Configuration
 * This file indicates whether the app is running in vulnerable or protected mode
 * 
 * DO NOT MANUALLY EDIT - Use: node scripts/switch-mitm-version.js [vulnerable|protected]
 */

// Current mode: 'protected' or 'vulnerable'
export const SECURITY_MODE = '${mode}';

// Check if running in vulnerable mode
export const isVulnerableMode = () => SECURITY_MODE === 'vulnerable';

// Check if running in protected mode  
export const isProtectedMode = () => SECURITY_MODE === 'protected';

export default {
  SECURITY_MODE,
  isVulnerableMode,
  isProtectedMode,
};
`;
  fs.writeFileSync(CONFIG_FILE, configContent);
}

function switchToVulnerable() {
  try {
    // Check if original exists
    if (!fs.existsSync(ORIGINAL_FILE)) {
      console.error('❌ Original keyExchange.js not found!');
      process.exit(1);
    }

    // Backup original if not already backed up
    if (!fs.existsSync(BACKUP_FILE)) {
      console.log('📦 Creating backup of original file...');
      fs.copyFileSync(ORIGINAL_FILE, BACKUP_FILE);
      console.log('✅ Backup created: keyExchange.backup.js');
    }

    // Check if vulnerable version exists
    if (!fs.existsSync(VULNERABLE_FILE)) {
      console.error('❌ Vulnerable version not found!');
      console.error('   Expected: client/src/crypto/keyExchange.vulnerable.js');
      process.exit(1);
    }

    // Replace with vulnerable version
    fs.copyFileSync(VULNERABLE_FILE, ORIGINAL_FILE);
    
    // Update config file
    updateSecurityModeConfig('vulnerable');
    
    console.log('✅ Switched to VULNERABLE version');
    console.log('⚠️  WARNING: Signatures are DISABLED - for demo only!');
    console.log('   Restart client: cd client && npm start');
  } catch (error) {
    console.error('❌ Error switching to vulnerable version:', error.message);
    process.exit(1);
  }
}

function switchToProtected() {
  try {
    // Check if backup exists
    if (!fs.existsSync(BACKUP_FILE)) {
      console.error('❌ Backup file not found!');
      console.error('   Cannot restore original version.');
      process.exit(1);
    }

    // Restore original
    fs.copyFileSync(BACKUP_FILE, ORIGINAL_FILE);
    
    // Update config file
    updateSecurityModeConfig('protected');
    
    console.log('✅ Switched to PROTECTED version');
    console.log('   Signatures are ENABLED');
    console.log('   Restart client: cd client && npm start');
  } catch (error) {
    console.error('❌ Error switching to protected version:', error.message);
    process.exit(1);
  }
}

function showStatus() {
  try {
    const content = fs.readFileSync(ORIGINAL_FILE, 'utf8');
    const isVulnerable = content.includes('VULNERABLE MODE') || 
                        content.includes('Signature verification DISABLED') ||
                        content.includes('// VULNERABLE:');
    
    if (isVulnerable) {
      console.log('📊 Current Status: VULNERABLE (Signatures DISABLED)');
    } else {
      console.log('📊 Current Status: PROTECTED (Signatures ENABLED)');
    }
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
  }
}

// Main
const command = process.argv[2];

switch (command) {
  case 'vulnerable':
  case 'vuln':
  case 'v':
    switchToVulnerable();
    break;
  
  case 'protected':
  case 'protect':
  case 'p':
    switchToProtected();
    break;
  
  case 'status':
  case 's':
    showStatus();
    break;
  
  default:
    console.log('MITM Version Switcher');
    console.log('');
    console.log('Usage: node scripts/switch-mitm-version.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  vulnerable, vuln, v  - Switch to vulnerable version (no signatures)');
    console.log('  protected, protect, p - Switch to protected version (with signatures)');
    console.log('  status, s             - Show current version status');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/switch-mitm-version.js vulnerable');
    console.log('  node scripts/switch-mitm-version.js protected');
    console.log('  node scripts/switch-mitm-version.js status');
    break;
}

