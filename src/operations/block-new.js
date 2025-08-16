/**
 * Block and multiline operations - EXACT match to GitHub's implementation
 * Based on markdown-toolbar-element index.ts lines 581-670
 */

import { 
  isMultipleLines, 
  expandSelectedText, 
  newlinesToSurroundSelectedText 
} from '../core/selection-new.js'

/**
 * Block style operation
 * GitHub: index.ts lines 581-646
 */
export function blockStyle(textarea, arg) {
  let newlinesToAppend
  let newlinesToPrepend

  const { prefix, suffix, blockPrefix, blockSuffix, replaceNext, prefixSpace, scanFor, surroundWithNewlines } = arg
  const originalSelectionStart = textarea.selectionStart
  const originalSelectionEnd = textarea.selectionEnd

  let selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  let prefixToUse = isMultipleLines(selectedText) && blockPrefix.length > 0 ? `${blockPrefix}\n` : prefix
  let suffixToUse = isMultipleLines(selectedText) && blockSuffix.length > 0 ? `\n${blockSuffix}` : suffix

  if (prefixSpace) {
    const beforeSelection = textarea.value[textarea.selectionStart - 1]
    if (textarea.selectionStart !== 0 && beforeSelection != null && !beforeSelection.match(/\s/)) {
      prefixToUse = ` ${prefixToUse}`
    }
  }
  selectedText = expandSelectedText(textarea, prefixToUse, suffixToUse, arg.multiline)
  let selectionStart = textarea.selectionStart
  let selectionEnd = textarea.selectionEnd
  const hasReplaceNext = replaceNext.length > 0 && suffixToUse.indexOf(replaceNext) > -1 && selectedText.length > 0
  if (surroundWithNewlines) {
    const ref = newlinesToSurroundSelectedText(textarea)
    newlinesToAppend = ref.newlinesToAppend
    newlinesToPrepend = ref.newlinesToPrepend
    prefixToUse = newlinesToAppend + prefix
    suffixToUse += newlinesToPrepend
  }

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
    let replacementText = prefixToUse + selectedText + suffixToUse
    selectionStart = originalSelectionStart + prefixToUse.length
    selectionEnd = originalSelectionEnd + prefixToUse.length
    const whitespaceEdges = selectedText.match(/^\s*|\s*$/g)
    if (arg.trimFirst && whitespaceEdges) {
      const leadingWhitespace = whitespaceEdges[0] || ''
      const trailingWhitespace = whitespaceEdges[1] || ''
      replacementText = leadingWhitespace + prefixToUse + selectedText.trim() + suffixToUse + trailingWhitespace
      selectionStart += leadingWhitespace.length
      selectionEnd -= trailingWhitespace.length
    }
    return { text: replacementText, selectionStart, selectionEnd }
  } else if (scanFor.length > 0 && selectedText.match(scanFor)) {
    suffixToUse = suffixToUse.replace(replaceNext, selectedText)
    const replacementText = prefixToUse + selectedText + suffixToUse
    selectionStart = selectionEnd = selectionStart + prefixToUse.length
    return { text: replacementText, selectionStart, selectionEnd }
  } else {
    const replacementText = prefixToUse + selectedText + suffixToUse
    selectionStart = selectionStart + prefixToUse.length + selectedText.length + suffixToUse.indexOf(replaceNext)
    selectionEnd = selectionStart + replaceNext.length
    return { text: replacementText, selectionStart, selectionEnd }
  }
}

/**
 * Multiline style operation
 * GitHub: index.ts lines 648-670
 */
export function multilineStyle(textarea, arg) {
  const { prefix, suffix, surroundWithNewlines } = arg
  let text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  let selectionStart = textarea.selectionStart
  let selectionEnd = textarea.selectionEnd
  const lines = text.split('\n')
  const undoStyle = lines.every(line => line.startsWith(prefix) && line.endsWith(suffix))

  if (undoStyle) {
    text = lines.map(line => line.slice(prefix.length, line.length - suffix.length)).join('\n')
    selectionEnd = selectionStart + text.length
  } else {
    text = lines.map(line => prefix + line + suffix).join('\n')
    if (surroundWithNewlines) {
      const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea)
      selectionStart += newlinesToAppend.length
      selectionEnd = selectionStart + text.length
      text = newlinesToAppend + text + newlinesToPrepend
    }
  }

  return { text, selectionStart, selectionEnd }
}