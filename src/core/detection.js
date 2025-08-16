/**
 * Format detection utilities
 */

import { FORMATS } from './formats.js'

/**
 * Check if text has a specific format applied
 */
function hasFormatApplied(text, format) {
  if (!format.prefix) return false
  
  if (format.suffix) {
    return text.startsWith(format.prefix) && text.endsWith(format.suffix)
  } else {
    return text.startsWith(format.prefix)
  }
}

/**
 * Get active formats at cursor position
 */
export function getActiveFormats(textarea) {
  if (!textarea) return []
  
  const formats = []
  const { selectionStart, selectionEnd, value } = textarea
  
  // Get current line for line-based formats
  const lines = value.split('\n')
  let lineStart = 0
  let currentLine = ''
  
  for (const line of lines) {
    if (selectionStart >= lineStart && selectionStart <= lineStart + line.length) {
      currentLine = line
      break
    }
    lineStart += line.length + 1
  }
  
  // Check line-based formats
  if (currentLine.startsWith('- ')) {
    if (currentLine.startsWith('- [ ] ') || currentLine.startsWith('- [x] ')) {
      formats.push('task-list')
    } else {
      formats.push('bullet-list')
    }
  }
  
  if (/^\d+\.\s/.test(currentLine)) {
    formats.push('numbered-list')
  }
  
  if (currentLine.startsWith('> ')) {
    formats.push('quote')
  }
  
  if (currentLine.startsWith('# ')) formats.push('header')
  if (currentLine.startsWith('## ')) formats.push('header-2')
  if (currentLine.startsWith('### ')) formats.push('header-3')
  
  // Check inline formats by looking around cursor
  const lookBehind = Math.max(0, selectionStart - 10)
  const lookAhead = Math.min(value.length, selectionEnd + 10)
  const surrounding = value.slice(lookBehind, lookAhead)
  
  // Check for bold
  if (surrounding.includes('**')) {
    const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart)
    const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100))
    const lastOpenBold = beforeCursor.lastIndexOf('**')
    const nextCloseBold = afterCursor.indexOf('**')
    if (lastOpenBold !== -1 && nextCloseBold !== -1) {
      formats.push('bold')
    }
  }
  
  // Check for italic
  if (surrounding.includes('_')) {
    const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart)
    const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100))
    const lastOpenItalic = beforeCursor.lastIndexOf('_')
    const nextCloseItalic = afterCursor.indexOf('_')
    if (lastOpenItalic !== -1 && nextCloseItalic !== -1) {
      formats.push('italic')
    }
  }
  
  // Check for code
  if (surrounding.includes('`')) {
    const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart)
    const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100))
    if (beforeCursor.includes('`') && afterCursor.includes('`')) {
      formats.push('code')
    }
  }
  
  // Check for link
  if (surrounding.includes('[') && surrounding.includes(']')) {
    const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart)
    const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100))
    const lastOpenBracket = beforeCursor.lastIndexOf('[')
    const nextCloseBracket = afterCursor.indexOf(']')
    if (lastOpenBracket !== -1 && nextCloseBracket !== -1) {
      const afterBracket = value.slice(selectionEnd + nextCloseBracket + 1, selectionEnd + nextCloseBracket + 10)
      if (afterBracket.startsWith('(')) {
        formats.push('link')
      }
    }
  }
  
  return formats
}

/**
 * Check if specific format is active at cursor
 */
export function hasFormat(textarea, format) {
  const activeFormats = getActiveFormats(textarea)
  return activeFormats.includes(format)
}

/**
 * Expand selection based on options
 */
export function expandSelection(textarea, options = {}) {
  if (!textarea) return
  
  const { toWord, toLine, toFormat } = options
  const { selectionStart, selectionEnd, value } = textarea
  
  if (toLine) {
    // Find line boundaries
    const lines = value.split('\n')
    let lineStart = 0
    let lineEnd = 0
    let currentPos = 0
    
    for (const line of lines) {
      if (selectionStart >= currentPos && selectionStart <= currentPos + line.length) {
        lineStart = currentPos
        lineEnd = currentPos + line.length
        break
      }
      currentPos += line.length + 1
    }
    
    textarea.selectionStart = lineStart
    textarea.selectionEnd = lineEnd
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