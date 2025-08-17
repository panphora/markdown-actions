/**
 * Block-level text formatting operations
 * Handles inline formats like bold, italic, code, and links
 */

import { expandSelectedText, newlinesToSurroundSelectedText, isMultipleLines } from '../core/selection.js'
import { insertText } from '../core/insertion.js'

/**
 * Apply block-level styling to selected text
 */
export function blockStyle(textarea, style) {
  let newlinesToAppend
  let newlinesToPrepend

  const { prefix, suffix, blockPrefix, blockSuffix, replaceNext, prefixSpace, scanFor, surroundWithNewlines, trimFirst } = style
  const originalSelectionStart = textarea.selectionStart
  const originalSelectionEnd = textarea.selectionEnd

  let selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  let prefixToUse = isMultipleLines(selectedText) && blockPrefix && blockPrefix.length > 0 ? `${blockPrefix}\n` : prefix
  let suffixToUse = isMultipleLines(selectedText) && blockSuffix && blockSuffix.length > 0 ? `\n${blockSuffix}` : suffix

  if (prefixSpace) {
    const beforeSelection = textarea.value[textarea.selectionStart - 1]
    if (textarea.selectionStart !== 0 && beforeSelection != null && !beforeSelection.match(/\s/)) {
      prefixToUse = ` ${prefixToUse}`
    }
  }
  
  selectedText = expandSelectedText(textarea, prefixToUse, suffixToUse, style.multiline)
  let selectionStart = textarea.selectionStart
  let selectionEnd = textarea.selectionEnd
  const hasReplaceNext = replaceNext && replaceNext.length > 0 && suffixToUse.indexOf(replaceNext) > -1 && selectedText.length > 0
  
  if (surroundWithNewlines) {
    const ref = newlinesToSurroundSelectedText(textarea)
    newlinesToAppend = ref.newlinesToAppend
    newlinesToPrepend = ref.newlinesToPrepend
    prefixToUse = newlinesToAppend + prefix
    suffixToUse += newlinesToPrepend
  }

  // Check if we should remove formatting (toggle off)
  if (selectedText.startsWith(prefixToUse) && selectedText.endsWith(suffixToUse)) {
    const replacementText = selectedText.slice(prefixToUse.length, selectedText.length - suffixToUse.length)
    if (originalSelectionStart === originalSelectionEnd) {
      let position = originalSelectionStart - prefixToUse.length
      position = Math.max(position, selectionStart)
      position = Math.min(position, selectionStart + replacementText.length)
      selectionStart = selectionEnd = position
    } else {
      selectionEnd = selectionStart + replacementText.length
    }
    return { text: replacementText, selectionStart, selectionEnd }
  } else if (!hasReplaceNext) {
    // Add formatting
    let replacementText = prefixToUse + selectedText + suffixToUse
    selectionStart = originalSelectionStart + prefixToUse.length
    selectionEnd = originalSelectionEnd + prefixToUse.length
    const whitespaceEdges = selectedText.match(/^\s*|\s*$/g)
    if (trimFirst && whitespaceEdges) {
      const leadingWhitespace = whitespaceEdges[0] || ''
      const trailingWhitespace = whitespaceEdges[1] || ''
      replacementText = leadingWhitespace + prefixToUse + selectedText.trim() + suffixToUse + trailingWhitespace
      selectionStart += leadingWhitespace.length
      selectionEnd -= trailingWhitespace.length
    }
    return { text: replacementText, selectionStart, selectionEnd }
  } else if (scanFor && scanFor.length > 0 && selectedText.match(scanFor)) {
    // Handle link/image with URL detection
    suffixToUse = suffixToUse.replace(replaceNext, selectedText)
    const replacementText = prefixToUse + suffixToUse
    selectionStart = selectionEnd = selectionStart + prefixToUse.length
    return { text: replacementText, selectionStart, selectionEnd }
  } else {
    // Handle link/image with placeholder
    const replacementText = prefixToUse + selectedText + suffixToUse
    selectionStart = selectionStart + prefixToUse.length + selectedText.length + suffixToUse.indexOf(replaceNext)
    selectionEnd = selectionStart + replaceNext.length
    return { text: replacementText, selectionStart, selectionEnd }
  }
}

/**
 * Apply style to selected text in textarea
 */
export function styleSelectedText(textarea, style) {
  const text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  
  let result
  if (style.orderedList || style.unorderedList) {
    // Will be handled by list operations
    return
  } else if (style.multiline && isMultipleLines(text)) {
    result = multilineStyle(textarea, style)
  } else {
    result = blockStyle(textarea, style)
  }

  insertText(textarea, result)
}

/**
 * Apply multiline styling (quotes, task lists, etc)
 * Note: This does NOT expand selection to line - that should be done by the caller if needed
 */
export function multilineStyle(textarea, style) {
  const { prefix, suffix, surroundWithNewlines } = style
  let text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  let selectionStart = textarea.selectionStart
  let selectionEnd = textarea.selectionEnd
  const lines = text.split('\n')
  
  // Check if we need to undo (all lines have the format)
  const undoStyle = lines.every(line => line.startsWith(prefix) && (!suffix || line.endsWith(suffix)))

  if (undoStyle) {
    // Remove the formatting
    text = lines.map(line => {
      let result = line.slice(prefix.length)
      if (suffix) {
        result = result.slice(0, result.length - suffix.length)
      }
      return result
    }).join('\n')
    selectionEnd = selectionStart + text.length
  } else {
    // Apply the formatting
    text = lines.map(line => prefix + line + (suffix || '')).join('\n')
    if (surroundWithNewlines) {
      const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea)
      selectionStart += newlinesToAppend.length
      selectionEnd = selectionStart + text.length
      text = newlinesToAppend + text + newlinesToPrepend
    }
  }

  return { text, selectionStart, selectionEnd }
}