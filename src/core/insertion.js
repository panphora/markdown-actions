/**
 * Text insertion system with undo/redo support
 * Extracted and adapted from GitHub's markdown-toolbar-element
 */

import { getDebugMode } from '../debug.js'

let canInsertText = null

/**
 * Insert text at current position with undo/redo support
 * @param {HTMLTextAreaElement} textarea - Target textarea
 * @param {Object} options - Text and selection options
 * @param {string} options.text - Text to insert
 * @param {number} [options.selectionStart] - New selection start
 * @param {number} [options.selectionEnd] - New selection end
 */
export function insertText(textarea, { text, selectionStart, selectionEnd }) {
  const debugMode = getDebugMode();
  
  if (debugMode) {
    console.group('🔧 insertText');
    console.log('Current selection:', `${textarea.selectionStart}-${textarea.selectionEnd}`);
    console.log('Text to insert:', JSON.stringify(text));
    console.log('New selection to set:', selectionStart, '-', selectionEnd);
  }
  
  // Make sure the textarea is focused
  textarea.focus();
  
  const originalSelectionStart = textarea.selectionStart
  const originalSelectionEnd = textarea.selectionEnd
  const before = textarea.value.slice(0, originalSelectionStart)
  const after = textarea.value.slice(originalSelectionEnd)
  
  if (debugMode) {
    console.log('Before text (last 20):', JSON.stringify(before.slice(-20)));
    console.log('After text (first 20):', JSON.stringify(after.slice(0, 20)));
    console.log('Selected text being replaced:', JSON.stringify(textarea.value.slice(originalSelectionStart, originalSelectionEnd)));
  }
  
  // Store the original value to check if execCommand actually changed it
  const originalValue = textarea.value

  // Try execCommand for both insertions and replacements to preserve undo history
  // execCommand('insertText') can handle replacing selected text
  const hasSelection = originalSelectionStart !== originalSelectionEnd
  
  if (canInsertText === null || canInsertText === true) {
    textarea.contentEditable = 'true'
    try {
      canInsertText = document.execCommand('insertText', false, text)
      if (debugMode) console.log('execCommand returned:', canInsertText, 'for text with', text.split('\n').length, 'lines');
    } catch (error) {
      canInsertText = false
      if (debugMode) console.log('execCommand threw error:', error);
    }
    textarea.contentEditable = 'false'
  }

  if (debugMode) {
    console.log('canInsertText before:', canInsertText);
    console.log('execCommand result:', canInsertText);
  }
  
  // Check if execCommand actually worked by comparing the value
  if (canInsertText) {
    const expectedValue = before + text + after
    const actualValue = textarea.value
    
    if (debugMode) {
      console.log('Expected length:', expectedValue.length);
      console.log('Actual length:', actualValue.length);
    }
    
    if (actualValue !== expectedValue) {
      if (debugMode) {
        console.log('execCommand changed the value but not as expected');
        console.log('Expected:', JSON.stringify(expectedValue.slice(0, 100)));
        console.log('Actual:', JSON.stringify(actualValue.slice(0, 100)));
      }
      // Don't set canInsertText to false here - execCommand did work
      // We just need to not double-insert
    }
  }

  if (!canInsertText) {
    if (debugMode) console.log('Using manual insertion');
    // Only do manual insertion if execCommand didn't change the value
    if (textarea.value === originalValue) {
      if (debugMode) console.log('Value unchanged, doing manual replacement');
      try {
        document.execCommand('ms-beginUndoUnit')
      } catch (e) {
        // Do nothing.
      }
      textarea.value = before + text + after
      try {
        document.execCommand('ms-endUndoUnit')
      } catch (e) {
        // Do nothing.
      }
      textarea.dispatchEvent(new CustomEvent('input', { bubbles: true, cancelable: true }))
    } else {
      if (debugMode) console.log('Value was changed by execCommand, skipping manual insertion');
    }
  }

  if (debugMode) console.log('Setting selection range:', selectionStart, selectionEnd);
  if (selectionStart != null && selectionEnd != null) {
    textarea.setSelectionRange(selectionStart, selectionEnd)
  } else {
    textarea.setSelectionRange(originalSelectionStart, textarea.selectionEnd)
  }
  
  if (debugMode) {
    console.log('Final value length:', textarea.value.length);
    console.groupEnd();
  }
}

/**
 * Configure undo method
 * @param {'native' | 'manual' | 'auto'} method - Undo method to use
 */
export function setUndoMethod(method) {
  switch (method) {
    case 'native':
      canInsertText = true
      break
    case 'manual':
      canInsertText = false
      break
    case 'auto':
      canInsertText = null
      break
  }
}