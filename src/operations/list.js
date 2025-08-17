/**
 * List operations for bullet and numbered lists
 */

import { expandSelectionToLine, newlinesToSurroundSelectedText, applyLineOperation } from '../core/selection.js'
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
  // Use applyLineOperation for consistent selection preservation
  const result = applyLineOperation(
    textarea,
    (ta) => listStyle(ta, style),
    {
      // Custom selection adjustment for lists
      adjustSelection: (isRemoving, selStart, selEnd, lineStart) => {
        // Get the current line to check if we're removing
        const currentLine = textarea.value.slice(lineStart, textarea.selectionEnd)
        const orderedListRegex = /^\d+\.\s+/
        const unorderedListRegex = /^- /
        
        // Check if we're removing a list
        const hasOrderedList = orderedListRegex.test(currentLine)
        const hasUnorderedList = unorderedListRegex.test(currentLine)
        const isRemovingCurrent = (style.orderedList && hasOrderedList) || (style.unorderedList && hasUnorderedList)
        
        if (selStart === selEnd) {
          // No selection - cursor position
          if (isRemovingCurrent) {
            // Removing list - adjust cursor back
            const prefixMatch = currentLine.match(style.orderedList ? orderedListRegex : unorderedListRegex)
            const prefixLength = prefixMatch ? prefixMatch[0].length : 0
            return {
              start: Math.max(selStart - prefixLength, lineStart),
              end: Math.max(selStart - prefixLength, lineStart)
            }
          } else if (hasOrderedList || hasUnorderedList) {
            // Converting from one list type to another
            const oldPrefixMatch = currentLine.match(hasOrderedList ? orderedListRegex : unorderedListRegex)
            const oldPrefixLength = oldPrefixMatch ? oldPrefixMatch[0].length : 0
            const newPrefixLength = style.unorderedList ? 2 : 3 // "- " or "1. "
            const adjustment = newPrefixLength - oldPrefixLength
            return {
              start: selStart + adjustment,
              end: selStart + adjustment
            }
          } else {
            // Adding new list
            const prefixLength = style.unorderedList ? 2 : 3 // "- " or "1. "
            return {
              start: selStart + prefixLength,
              end: selStart + prefixLength
            }
          }
        } else {
          // Has selection - preserve it
          if (isRemovingCurrent) {
            // Removing current list type
            const prefixMatch = currentLine.match(style.orderedList ? orderedListRegex : unorderedListRegex)
            const prefixLength = prefixMatch ? prefixMatch[0].length : 0
            return {
              start: Math.max(selStart - prefixLength, lineStart),
              end: Math.max(selEnd - prefixLength, lineStart)
            }
          } else if (hasOrderedList || hasUnorderedList) {
            // Converting from one list type to another
            const oldPrefixMatch = currentLine.match(hasOrderedList ? orderedListRegex : unorderedListRegex)
            const oldPrefixLength = oldPrefixMatch ? oldPrefixMatch[0].length : 0
            const newPrefixLength = style.unorderedList ? 2 : 3 // "- " or "1. "
            const adjustment = newPrefixLength - oldPrefixLength
            return {
              start: selStart + adjustment,
              end: selEnd + adjustment
            }
          } else {
            // Adding new list
            const prefixLength = style.unorderedList ? 2 : 3 // "- " or "1. "
            return {
              start: selStart + prefixLength,
              end: selEnd + prefixLength
            }
          }
        }
      }
    }
  )
  
  insertText(textarea, result)
}