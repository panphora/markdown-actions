/**
 * markdown-actions - Lightweight markdown toolbar functionality
 * Exact implementation matching GitHub's markdown-toolbar-element
 */

import { mergeStyleWithDefaults } from './core/style-args.js'
import { styleSelectedText } from './core/style-text.js'
import { setUndoMethod } from './core/insertion-new.js'
import { preserveSelection, expandSelectionToLine } from './core/selection-new.js'
import { getActiveFormats as getActive, hasFormat as has } from './core/detection.js'

/**
 * Format configurations matching GitHub's manualStyles
 * GitHub: index.ts lines 86-118
 */
const FORMATS = {
  bold: { prefix: '**', suffix: '**', trimFirst: true },
  italic: { prefix: '_', suffix: '_', trimFirst: true },
  code: { 
    prefix: '`', 
    suffix: '`', 
    blockPrefix: '```', 
    blockSuffix: '```' 
  },
  link: { 
    prefix: '[', 
    suffix: '](url)', 
    replaceNext: 'url', 
    scanFor: 'https?://' 
  },
  quote: { 
    prefix: '> ', 
    multiline: true, 
    surroundWithNewlines: true 
  },
  bulletList: { 
    prefix: '- ', 
    multiline: true, 
    unorderedList: true 
  },
  numberedList: { 
    prefix: '1. ', 
    multiline: true, 
    orderedList: true 
  },
  header1: { prefix: '# ' },
  header2: { prefix: '## ' },
  header3: { prefix: '### ' },
  header4: { prefix: '#### ' },
  header5: { prefix: '##### ' },
  header6: { prefix: '###### ' }
}

/**
 * Apply style to textarea
 * Mimics GitHub's applyStyle function (index.ts lines 801-827)
 */
function applyStyle(textarea, format) {
  const style = mergeStyleWithDefaults(format)
  textarea.focus()
  styleSelectedText(textarea, style)
}

/**
 * Toggle bold formatting
 */
export function toggleBold(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  applyStyle(textarea, FORMATS.bold)
}

/**
 * Toggle italic formatting
 */
export function toggleItalic(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  applyStyle(textarea, FORMATS.italic)
}

/**
 * Toggle code formatting
 */
export function toggleCode(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  applyStyle(textarea, FORMATS.code)
}

/**
 * Insert or toggle link formatting
 */
export function insertLink(textarea, options = {}) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  
  let format = { ...FORMATS.link }
  
  // Override with custom URL if provided
  if (options.url) {
    format.suffix = `](${options.url})`
    format.replaceNext = ''
  }
  
  // Handle custom text if provided
  if (options.text && !textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)) {
    const pos = textarea.selectionStart
    textarea.value = textarea.value.slice(0, pos) + options.text + textarea.value.slice(pos)
    textarea.selectionStart = pos
    textarea.selectionEnd = pos + options.text.length
  }
  
  applyStyle(textarea, format)
}

/**
 * Toggle bullet list formatting
 */
export function toggleBulletList(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  applyStyle(textarea, FORMATS.bulletList)
}

/**
 * Toggle numbered list formatting
 */
export function toggleNumberedList(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  applyStyle(textarea, FORMATS.numberedList)
}

/**
 * Toggle quote formatting
 */
export function toggleQuote(textarea) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  applyStyle(textarea, FORMATS.quote)
}

/**
 * Insert header with specific level
 */
export function insertHeader(textarea, level = 1) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  if (level < 1 || level > 6) level = 1
  
  const headerKey = `header${level}`
  const format = FORMATS[headerKey] || FORMATS.header1
  
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
  const newLine = format.prefix + cleanedLine
  
  // Use our style system
  const tempSelection = textarea.selectionStart
  textarea.value = value.slice(0, lineStart) + newLine + value.slice(lineEnd)
  textarea.selectionStart = lineStart + format.prefix.length
  textarea.selectionEnd = lineStart + newLine.length
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
  if (!textarea) return
  
  const { toWord, toLine } = options
  const { selectionStart, selectionEnd, value } = textarea
  
  if (toLine) {
    expandSelectionToLine(textarea)
  } else if (toWord && selectionStart === selectionEnd) {
    // Find word boundaries
    let start = selectionStart
    let end = selectionEnd
    
    // Move start back to word boundary
    while (start > 0 && !/\s/.test(value[start - 1])) {
      start--
    }
    
    // Move end forward to word boundary
    while (end < value.length && !/\s/.test(value[end])) {
      end++
    }
    
    textarea.selectionStart = start
    textarea.selectionEnd = end
  }
}

/**
 * Apply custom format
 */
export function applyCustomFormat(textarea, format) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  applyStyle(textarea, format)
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