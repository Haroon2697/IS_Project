/**
 * Security Mode Configuration
 * This file indicates whether the app is running in vulnerable or protected mode
 * 
 * DO NOT MANUALLY EDIT - Use: node scripts/switch-mitm-version.js [vulnerable|protected]
 */

// Current mode: 'protected' or 'vulnerable'
export const SECURITY_MODE = 'protected';

// Check if running in vulnerable mode
export const isVulnerableMode = () => SECURITY_MODE === 'vulnerable';

// Check if running in protected mode  
export const isProtectedMode = () => SECURITY_MODE === 'protected';

export default {
  SECURITY_MODE,
  isVulnerableMode,
  isProtectedMode,
};
