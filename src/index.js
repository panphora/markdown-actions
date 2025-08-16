/**
 * markdown-actions - Lightweight markdown toolbar functionality
 * Based on GitHub's markdown-toolbar-element
 */

import { FORMATS, mergeWithDefaults } from './core/formats.js'
import { insertText, setUndoMethod } from './core/insertion.js'
import { preserveSelection, isMultipleLines } from './core/selection.js'
import { blockStyle, multilineStyle } from './operations/block.js'
import { applyListStyle } from './operations/list.js'
import { getActiveFormats as getActive, hasFormat as has, expandSelection as expand } from './core/detection.js'

/**
 * Toggle bold formatting
 */
export function toggleBold(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  const style = mergeWithDefaults(FORMATS.bold)
  const result = blockStyle(textarea, style)
  insertText(textarea, result)
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
 */
export function toggleQuote(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  const style = mergeWithDefaults(FORMATS.quote)
  const result = multilineStyle(textarea, style)
  insertText(textarea, result)
}

/**
 * Insert header with specific level
 */
export function insertHeader(textarea, level = 1) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  if (level < 1 || level > 6) level = 1
  
  const headerKey = `header${level === 1 ? '1' : level}`
  const style = mergeWithDefaults(FORMATS[headerKey] || FORMATS.header1)
  
  // Select current line
  const value = textarea.value
  const start = textarea.selectionStart
  let lineStart = start
  let lineEnd = start
  
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
  
  // Remove any existing header formatting
  const cleanedLine = currentLine.replace(/^#{1,6}\s*/, '')
  
  // Apply new header
  const newLine = style.prefix + cleanedLine
  const result = {
    text: newLine,
    selectionStart: lineStart + style.prefix.length,
    selectionEnd: lineStart + newLine.length
  }
  
  insertText(textarea, result)
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
  insertHeader,
  getActiveFormats,
  hasFormat,
  expandSelection,
  applyCustomFormat,
  preserveSelection,
  setUndoMethod
}