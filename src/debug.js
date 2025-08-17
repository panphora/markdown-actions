/**
 * Debug utilities for markdown-actions
 * Add console logging to track what's happening
 */

// Debug mode flag - disabled by default
let debugMode = false;

/**
 * Enable or disable debug mode
 * @param {boolean} enabled - Whether to enable debug mode
 */
export function setDebugMode(enabled) {
  debugMode = enabled;
}

/**
 * Get current debug mode status
 * @returns {boolean} Whether debug mode is enabled
 */
export function getDebugMode() {
  return debugMode;
}

export function debugLog(funcName, message, data) {
  // These will be completely removed by esbuild's drop: ['console'] in production
  if (!debugMode) return;
  
  console.group(`🔍 ${funcName}`);
  console.log(message);
  if (data) {
    console.log('Data:', data);
  }
  console.groupEnd();
}

export function debugSelection(textarea, label) {
  // These will be completely removed by esbuild's drop: ['console'] in production
  if (!debugMode) return;
  
  const selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
  console.group(`📍 Selection: ${label}`);
  console.log('Position:', `${textarea.selectionStart}-${textarea.selectionEnd}`);
  console.log('Selected text:', JSON.stringify(selected));
  console.log('Length:', selected.length);
  
  // Show context around selection
  const before = textarea.value.slice(Math.max(0, textarea.selectionStart - 10), textarea.selectionStart);
  const after = textarea.value.slice(textarea.selectionEnd, Math.min(textarea.value.length, textarea.selectionEnd + 10));
  console.log('Context:', JSON.stringify(before) + '[SELECTION]' + JSON.stringify(after));
  console.groupEnd();
}

export function debugResult(result) {
  // These will be completely removed by esbuild's drop: ['console'] in production
  if (!debugMode) return;
  
  console.group('📝 Result');
  console.log('Text to insert:', JSON.stringify(result.text));
  console.log('New selection:', `${result.selectionStart}-${result.selectionEnd}`);
  console.groupEnd();
}