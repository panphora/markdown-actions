/**
 * Text insertion with undo/redo support
 * EXACT match to GitHub's implementation
 * Based on markdown-toolbar-element index.ts lines 444-485
 */

let canInsertText = null

/**
 * Insert text into textarea
 * GitHub: index.ts lines 446-485
 * CRITICAL: Uses the CURRENT selection (which may have been expanded)
 */
export function insertText(textarea, { text, selectionStart, selectionEnd }) {
  const originalSelectionStart = textarea.selectionStart
  const before = textarea.value.slice(0, originalSelectionStart)
  const after = textarea.value.slice(textarea.selectionEnd)

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

  if (selectionStart != null && selectionEnd != null) {
    textarea.setSelectionRange(selectionStart, selectionEnd)
  } else {
    textarea.setSelectionRange(originalSelectionStart, textarea.selectionEnd)
  }
}

/**
 * Set undo method (for configuration)
 */
export function setUndoMethod(method) {
  if (method === 'native') {
    canInsertText = true
  } else if (method === 'manual') {
    canInsertText = false
  } else {
    canInsertText = null
  }
}