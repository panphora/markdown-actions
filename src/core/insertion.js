/**
 * Text insertion system with undo/redo support
 * Extracted and adapted from GitHub's markdown-toolbar-element
 */

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
  const originalSelectionStart = textarea.selectionStart
  const before = textarea.value.slice(0, originalSelectionStart)
  const after = textarea.value.slice(textarea.selectionEnd)
  
  // Store the original value to check if execCommand actually changed it
  const originalValue = textarea.value

  if (canInsertText === null || canInsertText === true) {
    textarea.contentEditable = 'true'
    try {
      canInsertText = document.execCommand('insertText', false, text)
    } catch (error) {
      canInsertText = false
    }
    textarea.contentEditable = 'false'
  }

  if (canInsertText && !textarea.value.slice(0, textarea.selectionStart).endsWith(text)) {
    canInsertText = false
  }

  if (!canInsertText) {
    // Only do manual insertion if execCommand didn't change the value
    if (textarea.value === originalValue) {
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
    }
  }

  if (selectionStart != null && selectionEnd != null) {
    textarea.setSelectionRange(selectionStart, selectionEnd)
  } else {
    textarea.setSelectionRange(originalSelectionStart, textarea.selectionEnd)
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