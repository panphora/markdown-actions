/**
 * List operations - EXACT match to GitHub's implementation
 * Based on markdown-toolbar-element index.ts lines 676-784
 */

import { expandSelectionToLine, newlinesToSurroundSelectedText } from '../core/selection-new.js'

/**
 * Undo ordered list style
 * GitHub: index.ts lines 676-689
 */
function undoOrderedListStyle(text) {
  const lines = text.split('\n')
  const orderedListRegex = /^\d+\.\s+/
  const shouldUndoOrderedList = lines.every(line => orderedListRegex.test(line))
  let result = lines
  if (shouldUndoOrderedList) {
    result = lines.map(line => line.replace(orderedListRegex, ''))
  }

  return {
    text: result.join('\n'),
    processed: shouldUndoOrderedList
  }
}

/**
 * Undo unordered list style
 * GitHub: index.ts lines 691-704
 */
function undoUnorderedListStyle(text) {
  const lines = text.split('\n')
  const unorderedListPrefix = '- '
  const shouldUndoUnorderedList = lines.every(line => line.startsWith(unorderedListPrefix))
  let result = lines
  if (shouldUndoUnorderedList) {
    result = lines.map(line => line.slice(unorderedListPrefix.length, line.length))
  }

  return {
    text: result.join('\n'),
    processed: shouldUndoUnorderedList
  }
}

/**
 * Make prefix for list item
 * GitHub: index.ts lines 706-712
 */
function makePrefix(index, unorderedList) {
  if (unorderedList) {
    return '- '
  } else {
    return `${index + 1}. `
  }
}

/**
 * Clear existing list style
 * GitHub: index.ts lines 714-728
 */
function clearExistingListStyle(style, selectedText) {
  let undoResultOpositeList
  let undoResult
  let pristineText
  if (style.orderedList) {
    undoResult = undoOrderedListStyle(selectedText)
    undoResultOpositeList = undoUnorderedListStyle(undoResult.text)
    pristineText = undoResultOpositeList.text
  } else {
    undoResult = undoUnorderedListStyle(selectedText)
    undoResultOpositeList = undoOrderedListStyle(undoResult.text)
    pristineText = undoResultOpositeList.text
  }
  return [undoResult, undoResultOpositeList, pristineText]
}

/**
 * Apply list style to text
 * GitHub: index.ts lines 730-784
 * CRITICAL: This function modifies the textarea selection via expandSelectionToLine
 */
export function listStyle(textarea, style) {
  const noInitialSelection = textarea.selectionStart === textarea.selectionEnd
  let selectionStart = textarea.selectionStart
  let selectionEnd = textarea.selectionEnd

  // Select whole line - MODIFIES textarea.selectionStart and textarea.selectionEnd
  expandSelectionToLine(textarea)

  const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)

  // If the user intent was to do an undo, we will stop after this.
  // Otherwise, we will still undo to other list type to prevent list stacking
  const [undoResult, undoResultOpositeList, pristineText] = clearExistingListStyle(style, selectedText)

  const prefixedLines = pristineText.split('\n').map((value, index) => {
    return `${makePrefix(index, style.unorderedList)}${value}`
  })

  const totalPrefixLength = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
    return previousValue + makePrefix(currentIndex, style.unorderedList).length
  }, 0)

  const totalPrefixLengthOpositeList = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
    return previousValue + makePrefix(currentIndex, !style.unorderedList).length
  }, 0)

  if (undoResult.processed) {
    if (noInitialSelection) {
      selectionStart = Math.max(selectionStart - makePrefix(0, style.unorderedList).length, 0)
      selectionEnd = selectionStart
    } else {
      selectionStart = textarea.selectionStart
      selectionEnd = textarea.selectionEnd - totalPrefixLength
    }
    return { text: pristineText, selectionStart, selectionEnd }
  }

  const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea)
  const text = newlinesToAppend + prefixedLines.join('\n') + newlinesToPrepend

  if (noInitialSelection) {
    selectionStart = Math.max(selectionStart + makePrefix(0, style.unorderedList).length + newlinesToAppend.length, 0)
    selectionEnd = selectionStart
  } else {
    if (undoResultOpositeList.processed) {
      selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0)
      selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength - totalPrefixLengthOpositeList
    } else {
      selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0)
      selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength
    }
  }

  return { text, selectionStart, selectionEnd }
}