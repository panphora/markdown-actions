/**
 * markdown-actions - Lightweight markdown toolbar functionality
 * Based on GitHub's markdown-toolbar-element
 */

import { FORMATS, mergeWithDefaults } from './core/formats.js'
import { insertText, setUndoMethod } from './core/insertion.js'
import { preserveSelection, isMultipleLines, expandSelectionToLine, applyLineOperation } from './core/selection.js'
import { blockStyle, multilineStyle } from './operations/block.js'
import { applyListStyle } from './operations/list.js'
import { getActiveFormats as getActive, hasFormat as has, expandSelection as expand } from './core/detection.js'
import { debugLog, debugSelection, debugResult, setDebugMode, getDebugMode } from './debug.js'

/**
 * Toggle bold formatting
 */
export function toggleBold(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  
  debugLog('toggleBold', 'Starting');
  debugSelection(textarea, 'Before');
  
  const style = mergeWithDefaults(FORMATS.bold)
  const result = blockStyle(textarea, style)
  
  debugResult(result);
  
  insertText(textarea, result)
  
  debugSelection(textarea, 'After');
}

/**
 * Toggle italic formatting
 */
export function toggleItalic(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  const style = mergeWithDefaults(FORMATS.italic)
  const result = blockStyle(textarea, style)
  insertText(textarea, result)
}

/**
 * Toggle code formatting
 */
export function toggleCode(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  const style = mergeWithDefaults(FORMATS.code)
  
  // Use block style for single line, multiline style for multiple lines
  let result
  if (isMultipleLines(selectedText)) {
    // For multiline, we want code blocks
    const blockStyle = {
      prefix: '```\n',
      suffix: '\n```',
      surroundWithNewlines: true
    }
    result = multilineStyle(textarea, mergeWithDefaults(blockStyle))
  } else {
    result = blockStyle(textarea, style)
  }
  
  insertText(textarea, result)
}

/**
 * Insert or toggle link formatting
 */
export function insertLink(textarea, options = {}) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  
  const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  let style = mergeWithDefaults(FORMATS.link)
  
  // Override with custom URL if provided
  if (options.url) {
    style.suffix = `](${options.url})`
    style.replaceNext = ''
  }
  
  // Override with custom text if provided
  if (options.text && !selectedText) {
    // Insert the text and select it
    const pos = textarea.selectionStart
    textarea.value = textarea.value.slice(0, pos) + options.text + textarea.value.slice(pos)
    textarea.selectionStart = pos
    textarea.selectionEnd = pos + options.text.length
  }
  
  const result = blockStyle(textarea, style)
  insertText(textarea, result)
}

/**
 * Toggle bullet list formatting
 */
export function toggleBulletList(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  const style = mergeWithDefaults(FORMATS.bulletList)
  applyListStyle(textarea, style)
}

/**
 * Toggle numbered list formatting
 */
export function toggleNumberedList(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  const style = mergeWithDefaults(FORMATS.numberedList)
  applyListStyle(textarea, style)
}

/**
 * Toggle quote formatting
 * Matches GitHub's implementation for quotes
 */
export function toggleQuote(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  
  debugLog('toggleQuote', 'Starting');
  debugSelection(textarea, 'Initial');
  
  const style = mergeWithDefaults(FORMATS.quote)
  
  // Use the reusable line operation helper
  const result = applyLineOperation(
    textarea,
    (ta) => multilineStyle(ta, style),
    { prefix: style.prefix }
  )
  
  debugResult(result);
  insertText(textarea, result)
  debugSelection(textarea, 'Final');
}

/**
 * Toggle task list formatting
 * Matches GitHub's implementation for task lists
 */
export function toggleTaskList(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  
  const style = mergeWithDefaults(FORMATS.taskList)
  
  // Use the reusable line operation helper
  const result = applyLineOperation(
    textarea,
    (ta) => multilineStyle(ta, style),
    { prefix: style.prefix }
  )
  
  insertText(textarea, result)
}

/**
 * Insert or toggle header with specific level
 */
export function insertHeader(textarea, level = 1, toggle = false) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  if (level < 1 || level > 6) level = 1
  
  // Save original cursor position before any expansion
  const originalStart = textarea.selectionStart
  const originalEnd = textarea.selectionEnd
  const noInitialSelection = originalStart === originalEnd
  
  const headerKey = `header${level === 1 ? '1' : level}`
  const style = mergeWithDefaults(FORMATS[headerKey] || FORMATS.header1)
  
  // Select current line
  const value = textarea.value
  let lineStart = originalStart
  let lineEnd = originalStart
  
  // Find line boundaries
  while (lineStart > 0 && value[lineStart - 1] !== '\n') {
    lineStart--
  }
  while (lineEnd < value.length && value[lineEnd] !== '\n') {
    lineEnd++
  }
  
  textarea.selectionStart = lineStart
  textarea.selectionEnd = lineEnd
  
  const currentLine = value.slice(lineStart, lineEnd)
  
  // Check if we're removing or changing existing header
  const existingHeaderMatch = currentLine.match(/^(#{1,6})\s*/)
  const existingPrefixLength = existingHeaderMatch ? existingHeaderMatch[0].length : 0
  const existingLevel = existingHeaderMatch ? existingHeaderMatch[1].length : 0
  
  // Remove any existing header formatting
  const cleanedLine = currentLine.replace(/^#{1,6}\s*/, '')
  
  let newLine
  let isRemoving = false
  
  // If toggle mode and current line has the same header level, remove it
  if (toggle && existingLevel === level) {
    newLine = cleanedLine
    isRemoving = true
  } else {
    // Apply new header
    newLine = style.prefix + cleanedLine
  }
  
  let selectionStart, selectionEnd
  
  if (noInitialSelection) {
    // Calculate where cursor should be after the operation
    const cursorOffsetInLine = originalStart - lineStart
    
    if (isRemoving) {
      // We're removing the header
      if (cursorOffsetInLine < existingPrefixLength) {
        // Cursor was in the header prefix, move to start of line
        selectionStart = lineStart
      } else {
        // Cursor was in the text, move back by prefix length
        selectionStart = originalStart - existingPrefixLength
      }
    } else if (existingPrefixLength > 0) {
      // We're replacing an existing header
      if (cursorOffsetInLine < existingPrefixLength) {
        // Cursor was in the header prefix, keep it at the same position
        selectionStart = lineStart + Math.min(cursorOffsetInLine, style.prefix.length)
      } else {
        // Cursor was in the text, adjust by the difference in prefix lengths
        const prefixDiff = style.prefix.length - existingPrefixLength
        selectionStart = originalStart + prefixDiff
      }
    } else {
      // We're adding a new header
      // Move cursor by the length of the new prefix
      selectionStart = originalStart + style.prefix.length
    }
    
    // Ensure cursor doesn't go past end of line
    selectionStart = Math.min(selectionStart, lineStart + newLine.length)
    selectionEnd = selectionStart
  } else {
    // Keep selection if there was one
    if (isRemoving) {
      selectionStart = lineStart
      selectionEnd = lineStart + newLine.length
    } else {
      selectionStart = lineStart + style.prefix.length
      selectionEnd = lineStart + newLine.length
    }
  }
  
  const result = {
    text: newLine,
    selectionStart,
    selectionEnd
  }
  
  insertText(textarea, result)
}

/**
 * Toggle H1 header
 */
export function toggleH1(textarea) {
  insertHeader(textarea, 1, true)
}

/**
 * Toggle H2 header
 */
export function toggleH2(textarea) {
  insertHeader(textarea, 2, true)
}

/**
 * Toggle H3 header
 */
export function toggleH3(textarea) {
  insertHeader(textarea, 3, true)
}

/**
 * Get active formats at cursor position
 */
export function getActiveFormats(textarea) {
  return getActive(textarea)
}

/**
 * Check if format is active at cursor
 */
export function hasFormat(textarea, format) {
  return has(textarea, format)
}

/**
 * Expand selection based on options
 */
export function expandSelection(textarea, options = {}) {
  expand(textarea, options)
}

/**
 * Apply custom format
 */
export function applyCustomFormat(textarea, format) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  
  const style = mergeWithDefaults(format)
  let result
  
  if (style.multiline) {
    const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
    if (isMultipleLines(selectedText)) {
      result = multilineStyle(textarea, style)
    } else {
      result = blockStyle(textarea, style)
    }
  } else {
    result = blockStyle(textarea, style)
  }
  
  insertText(textarea, result)
}

/**
 * Preserve selection during callback
 */
export { preserveSelection }

/**
 * Configure undo method
 */
export { setUndoMethod }

/**
 * Debug mode control
 */
export { setDebugMode, getDebugMode }

/**
 * Default export with all functions
 */
export default {
  toggleBold,
  toggleItalic,
  toggleCode,
  insertLink,
  toggleBulletList,
  toggleNumberedList,
  toggleQuote,
  toggleTaskList,
  insertHeader,
  toggleH1,
  toggleH2,
  toggleH3,
  getActiveFormats,
  hasFormat,
  expandSelection,
  applyCustomFormat,
  preserveSelection,
  setUndoMethod,
  setDebugMode,
  getDebugMode
}