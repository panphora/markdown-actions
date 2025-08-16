/**
 * Main text styling orchestration
 * EXACT match to GitHub's implementation
 * Based on markdown-toolbar-element index.ts lines 487-500
 */

import { isMultipleLines } from './selection-new.js'
import { insertText } from './insertion-new.js'
import { blockStyle, multilineStyle } from '../operations/block-new.js'
import { listStyle } from '../operations/list-new.js'

/**
 * Style selected text in textarea
 * GitHub: index.ts lines 487-500
 * CRITICAL: This is the main orchestrator that decides which operation to use
 */
export function styleSelectedText(textarea, styleArgs) {
  const text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)

  let result
  if (styleArgs.orderedList || styleArgs.unorderedList) {
    result = listStyle(textarea, styleArgs)
  } else if (styleArgs.multiline && isMultipleLines(text)) {
    result = multilineStyle(textarea, styleArgs)
  } else {
    result = blockStyle(textarea, styleArgs)
  }

  insertText(textarea, result)
}