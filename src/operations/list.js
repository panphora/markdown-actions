/**
 * List operations for bullet and numbered lists
 */

import { expandSelectionToLine, newlinesToSurroundSelectedText } from '../core/selection.js'
import { insertText } from '../core/insertion.js'

/**
 * Undo ordered list formatting
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
 * Undo unordered list formatting
 */
function undoUnorderedListStyle(text) {
  const lines = text.split('\n')
  const unorderedListPrefix = '- '
  const shouldUndoUnorderedList = lines.every(line => line.startsWith(unorderedListPrefix))
  let result = lines
  if (shouldUndoUnorderedList) {
    result = lines.map(line => line.slice(unorderedListPrefix.length))
  }

  return {
    text: result.join('\n'),
    processed: shouldUndoUnorderedList
  }
}

/**
 * Make prefix for list item
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
 */
function clearExistingListStyle(style, selectedText) {
  let undoResult
  let undoResultOppositeList
  let pristineText
  
  if (style.orderedList) {
    undoResult = undoOrderedListStyle(selectedText)
    undoResultOppositeList = undoUnorderedListStyle(undoResult.text)
    pristineText = undoResultOppositeList.text
  } else {
    undoResult = undoUnorderedListStyle(selectedText)
    undoResultOppositeList = undoOrderedListStyle(undoResult.text)
    pristineText = undoResultOppositeList.text
  }
  
  return [undoResult, undoResultOppositeList, pristineText]
}

/**
 * Apply list styling to selected text
 */
export function listStyle(textarea, style) {
  const noInitialSelection = textarea.selectionStart === textarea.selectionEnd
  let selectionStart = textarea.selectionStart
  let selectionEnd = textarea.selectionEnd

  // Select whole line
  expandSelectionToLine(textarea)

  const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)

  // Clear any existing list formatting
  const [undoResult, undoResultOppositeList, pristineText] = clearExistingListStyle(style, selectedText)

  const prefixedLines = pristineText.split('\n').map((value, index) => {
    return `${makePrefix(index, style.unorderedList)}${value}`
  })

  const totalPrefixLength = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
    return previousValue + makePrefix(currentIndex, style.unorderedList).length
  }, 0)

  const totalPrefixLengthOppositeList = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
    return previousValue + makePrefix(currentIndex, !style.unorderedList).length
  }, 0)

  // If we're undoing the same list type, just return the pristine text
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

  // Apply new list formatting
  const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea)
  const text = newlinesToAppend + prefixedLines.join('\n') + newlinesToPrepend

  if (noInitialSelection) {
    selectionStart = Math.max(selectionStart + makePrefix(0, style.unorderedList).length + newlinesToAppend.length, 0)
    selectionEnd = selectionStart
  } else {
    if (undoResultOppositeList.processed) {
      // Converting from one list type to another
      selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0)
      selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength - totalPrefixLengthOppositeList
    } else {
      // Adding list formatting to plain text
      selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0)
      selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength
    }
  }

  return { text, selectionStart, selectionEnd }
}

/**
 * Apply list style to textarea
 */
export function applyListStyle(textarea, style) {
  // Save the original selection boundaries before expansion
  const originalStart = textarea.selectionStart
  const originalEnd = textarea.selectionEnd
  
  // Get the result which includes expandSelectionToLine
  const result = listStyle(textarea, style)
  
  // At this point, textarea selection has been expanded to full line(s)
  // insertText will use the current (expanded) selection to know what to replace
  insertText(textarea, result)
}