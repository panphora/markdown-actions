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
  
  // blockStyle already handles both inline and block code correctly
  const style = mergeWithDefaults(FORMATS.code)
  const result = blockStyle(textarea, style)
  insertText(textarea, result)
}

/**
 * Insert or toggle link formatting
 */
export function insertLink(textarea, options = {}) {
  if (!textarea || textarea.disabled || textarea.readOnly) return
  
  const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  let style = mergeWithDefaults(FORMATS.link)
  
  // Check if selected text is a URL
  const isURL = selectedText && selectedText.match(/^https?:\/\//)
  
  if (isURL && !options.url) {
    // If selected text is a URL, use it as both link text and URL
    style.suffix = `](${selectedText})`
    style.replaceNext = ''
    // Don't change the selected text, it becomes the link text
  } else if (options.url) {
    // Override with custom URL if provided
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
  
  debugLog('insertHeader', `============ START ============`);
  debugLog('insertHeader', `Level: ${level}, Toggle: ${toggle}`);
  debugLog('insertHeader', `Initial cursor: ${textarea.selectionStart}-${textarea.selectionEnd}`);
  
  const headerKey = `header${level === 1 ? '1' : level}`
  const style = mergeWithDefaults(FORMATS[headerKey] || FORMATS.header1)
  debugLog('insertHeader', `Style prefix: "${style.prefix}"`);
  
  // Save original positions and get line info BEFORE applyLineOperation
  const value = textarea.value
  const originalStart = textarea.selectionStart
  const originalEnd = textarea.selectionEnd
  
  // Find the current line boundaries to check existing header
  let lineStart = originalStart
  while (lineStart > 0 && value[lineStart - 1] !== '\n') {
    lineStart--
  }
  let lineEnd = originalEnd
  while (lineEnd < value.length && value[lineEnd] !== '\n') {
    lineEnd++
  }
  
  // Get current line and check for existing header
  const currentLineContent = value.slice(lineStart, lineEnd)
  debugLog('insertHeader', `Current line (before): "${currentLineContent}"`);
  
  const existingHeaderMatch = currentLineContent.match(/^(#{1,6})\s*/)
  const existingLevel = existingHeaderMatch ? existingHeaderMatch[1].length : 0
  const existingPrefixLength = existingHeaderMatch ? existingHeaderMatch[0].length : 0
  
  debugLog('insertHeader', `Existing header check:`);
  debugLog('insertHeader', `  - Match: ${existingHeaderMatch ? `"${existingHeaderMatch[0]}"` : 'none'}`);
  debugLog('insertHeader', `  - Existing level: ${existingLevel}`);
  debugLog('insertHeader', `  - Existing prefix length: ${existingPrefixLength}`);
  debugLog('insertHeader', `  - Target level: ${level}`);
  
  // Determine if we're toggling off
  const shouldToggleOff = toggle && existingLevel === level
  debugLog('insertHeader', `Should toggle OFF: ${shouldToggleOff} (toggle=${toggle}, existingLevel=${existingLevel}, level=${level})`);
  
  // Use applyLineOperation for consistent behavior
  const result = applyLineOperation(
    textarea,
    (ta) => {
      const currentLine = ta.value.slice(ta.selectionStart, ta.selectionEnd)
      debugLog('insertHeader', `Line in operation: "${currentLine}"`);
      
      // Remove any existing header formatting
      const cleanedLine = currentLine.replace(/^#{1,6}\s*/, '')
      debugLog('insertHeader', `Cleaned line: "${cleanedLine}"`);
      
      let newLine
      
      if (shouldToggleOff) {
        // Toggle off - just use the cleaned line
        debugLog('insertHeader', 'ACTION: Toggling OFF - removing header');
        newLine = cleanedLine
      } else if (existingLevel > 0) {
        // Replace existing header with new one
        debugLog('insertHeader', `ACTION: Replacing H${existingLevel} with H${level}`);
        newLine = style.prefix + cleanedLine
      } else {
        // Add new header
        debugLog('insertHeader', 'ACTION: Adding new header');
        newLine = style.prefix + cleanedLine
      }
      
      debugLog('insertHeader', `New line: "${newLine}"`);
      
      return {
        text: newLine,
        selectionStart: ta.selectionStart,
        selectionEnd: ta.selectionEnd
      }
    },
    {
      prefix: style.prefix,
      // Custom selection adjustment for headers
      adjustSelection: (isRemoving, selStart, selEnd, lineStartPos) => {
        debugLog('insertHeader', `Adjusting selection:`);
        debugLog('insertHeader', `  - isRemoving param: ${isRemoving}`);
        debugLog('insertHeader', `  - shouldToggleOff: ${shouldToggleOff}`);
        debugLog('insertHeader', `  - selStart: ${selStart}, selEnd: ${selEnd}`);
        debugLog('insertHeader', `  - lineStartPos: ${lineStartPos}`);
        
        if (shouldToggleOff) {
          // Removing the header entirely
          const adjustment = Math.max(selStart - existingPrefixLength, lineStartPos)
          debugLog('insertHeader', `  - Removing header, adjusting by -${existingPrefixLength}`);
          return {
            start: adjustment,
            end: selStart === selEnd ? adjustment : Math.max(selEnd - existingPrefixLength, lineStartPos)
          }
        } else if (existingPrefixLength > 0) {
          // Replacing existing header with new one
          const prefixDiff = style.prefix.length - existingPrefixLength
          debugLog('insertHeader', `  - Replacing header, adjusting by ${prefixDiff}`);
          return {
            start: selStart + prefixDiff,
            end: selEnd + prefixDiff
          }
        } else {
          // Adding new header
          debugLog('insertHeader', `  - Adding header, adjusting by +${style.prefix.length}`);
          return {
            start: selStart + style.prefix.length,
            end: selEnd + style.prefix.length
          }
        }
      }
    }
  )
  
  debugLog('insertHeader', `Final result: text="${result.text}", cursor=${result.selectionStart}-${result.selectionEnd}`);
  debugLog('insertHeader', `============ END ============`);
  
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