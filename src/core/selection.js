/**
 * Core selection utilities extracted and adapted from GitHub's markdown-toolbar-element
 */

/**
 * Check if string contains multiple lines
 */
export function isMultipleLines(string) {
  return string.trim().split('\n').length > 1
}

/**
 * Find the start of the word at position i
 */
export function wordSelectionStart(text, i) {
  let index = i
  while (text[index] && text[index - 1] != null && !text[index - 1].match(/\s/)) {
    index--
  }
  return index
}

/**
 * Find the end of the word at position i
 */
export function wordSelectionEnd(text, i, multiline) {
  let index = i
  const breakpoint = multiline ? /\n/ : /\s/
  while (text[index] && !text[index].match(breakpoint)) {
    index++
  }
  return index
}

/**
 * Expand selection to line boundaries
 */
export function expandSelectionToLine(textarea) {
  const lines = textarea.value.split('\n')
  let counter = 0
  for (let index = 0; index < lines.length; index++) {
    const lineLength = lines[index].length + 1
    if (textarea.selectionStart >= counter && textarea.selectionStart < counter + lineLength) {
      textarea.selectionStart = counter
    }
    if (textarea.selectionEnd >= counter && textarea.selectionEnd < counter + lineLength) {
      // For the last line, don't go past the actual text length
      if (index === lines.length - 1) {
        textarea.selectionEnd = Math.min(counter + lines[index].length, textarea.value.length)
      } else {
        textarea.selectionEnd = counter + lineLength - 1
      }
    }
    counter += lineLength
  }
}

/**
 * Expand selected text with smart boundary detection
 */
export function expandSelectedText(textarea, prefixToUse, suffixToUse, multiline = false) {
  if (textarea.selectionStart === textarea.selectionEnd) {
    textarea.selectionStart = wordSelectionStart(textarea.value, textarea.selectionStart)
    textarea.selectionEnd = wordSelectionEnd(textarea.value, textarea.selectionEnd, multiline)
  } else {
    const expandedSelectionStart = textarea.selectionStart - prefixToUse.length
    const expandedSelectionEnd = textarea.selectionEnd + suffixToUse.length
    const beginsWithPrefix = textarea.value.slice(expandedSelectionStart, textarea.selectionStart) === prefixToUse
    const endsWithSuffix = textarea.value.slice(textarea.selectionEnd, expandedSelectionEnd) === suffixToUse
    if (beginsWithPrefix && endsWithSuffix) {
      textarea.selectionStart = expandedSelectionStart
      textarea.selectionEnd = expandedSelectionEnd
    }
  }
  return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
}

/**
 * Calculate newlines needed to surround selected text
 */
export function newlinesToSurroundSelectedText(textarea) {
  const beforeSelection = textarea.value.slice(0, textarea.selectionStart)
  const afterSelection = textarea.value.slice(textarea.selectionEnd)

  const breaksBefore = beforeSelection.match(/\n*$/)
  const breaksAfter = afterSelection.match(/^\n*/)
  const newlinesBeforeSelection = breaksBefore ? breaksBefore[0].length : 0
  const newlinesAfterSelection = breaksAfter ? breaksAfter[0].length : 0

  let newlinesToAppend = ''
  let newlinesToPrepend = ''

  if (beforeSelection.match(/\S/) && newlinesBeforeSelection < 2) {
    newlinesToAppend = '\n'.repeat(2 - newlinesBeforeSelection)
  }

  if (afterSelection.match(/\S/) && newlinesAfterSelection < 2) {
    newlinesToPrepend = '\n'.repeat(2 - newlinesAfterSelection)
  }

  return { newlinesToAppend, newlinesToPrepend }
}

/**
 * Utility to preserve selection during operations
 */
export function preserveSelection(textarea, callback) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const scrollTop = textarea.scrollTop
  
  callback()
  
  textarea.selectionStart = start
  textarea.selectionEnd = end
  textarea.scrollTop = scrollTop
}

/**
 * Apply a line-based operation with cursor preservation
 * This function handles expanding to line boundaries and preserving cursor position
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {Function} operation - The operation to perform (receives textarea and returns result)
 * @param {Object} options - Options for the operation
 * @param {string} options.prefix - The prefix being added/removed (for cursor adjustment)
 * @param {Function} options.adjustSelection - Custom selection adjustment function
 * @returns {Object} The result from the operation with adjusted cursor position
 */
export function applyLineOperation(textarea, operation, options = {}) {
  // Save original cursor position AND selection before any expansion
  const originalStart = textarea.selectionStart
  const originalEnd = textarea.selectionEnd
  const noInitialSelection = originalStart === originalEnd
  
  // Store the line start position to calculate offset later
  const value = textarea.value
  let lineStart = originalStart
  
  // Find start of the line containing the selection start
  while (lineStart > 0 && value[lineStart - 1] !== '\n') {
    lineStart--
  }
  
  // Expand selection to line boundaries for the operation
  if (noInitialSelection) {
    // Expand to current line when no selection
    let lineEnd = originalStart
    
    // Find end of current line
    while (lineEnd < value.length && value[lineEnd] !== '\n') {
      lineEnd++
    }
    
    textarea.selectionStart = lineStart
    textarea.selectionEnd = lineEnd
  } else {
    // For selections, expand to full lines
    expandSelectionToLine(textarea)
  }
  
  // Apply the operation
  const result = operation(textarea)
  
  // Restore original selection/cursor with prefix adjustment
  if (options.adjustSelection) {
    // Use custom selection adjustment logic
    const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
    const isRemoving = selectedText.startsWith(options.prefix)
    const adjusted = options.adjustSelection(isRemoving, originalStart, originalEnd, lineStart)
    result.selectionStart = adjusted.start
    result.selectionEnd = adjusted.end
  } else if (options.prefix) {
    // Use default prefix-based adjustment
    const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
    const isRemoving = selectedText.startsWith(options.prefix)
    
    if (noInitialSelection) {
      // No selection - just restore cursor position
      if (isRemoving) {
        // When removing prefix, adjust cursor position
        result.selectionStart = Math.max(originalStart - options.prefix.length, lineStart)
        result.selectionEnd = result.selectionStart
      } else {
        // When adding prefix, adjust cursor position
        result.selectionStart = originalStart + options.prefix.length
        result.selectionEnd = result.selectionStart
      }
    } else {
      // Had a selection - restore it with adjustment
      if (isRemoving) {
        // When removing prefix, shift selection back
        result.selectionStart = Math.max(originalStart - options.prefix.length, lineStart)
        result.selectionEnd = Math.max(originalEnd - options.prefix.length, lineStart)
      } else {
        // When adding prefix, shift selection forward
        result.selectionStart = originalStart + options.prefix.length
        result.selectionEnd = originalEnd + options.prefix.length
      }
    }
  }
  
  return result
}