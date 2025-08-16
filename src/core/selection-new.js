/**
 * Selection utilities - EXACT match to GitHub's implementation
 * Based on markdown-toolbar-element index.ts
 */

/**
 * Check if string contains multiple lines
 * GitHub: index.ts line 419-421
 */
export function isMultipleLines(string) {
  return string.trim().split('\n').length > 1
}

/**
 * Repeat string n times
 * GitHub: index.ts line 423-425
 */
function repeat(string, n) {
  return Array(n + 1).join(string)
}

/**
 * Find word selection start
 * GitHub: index.ts line 427-433
 */
export function wordSelectionStart(text, i) {
  let index = i
  while (text[index] && text[index - 1] != null && !text[index - 1].match(/\s/)) {
    index--
  }
  return index
}

/**
 * Find word selection end
 * GitHub: index.ts line 435-442
 */
export function wordSelectionEnd(text, i, multiline) {
  let index = i
  const breakpoint = multiline ? /\n/ : /\s/
  while (text[index] && !text[index].match(breakpoint)) {
    index++
  }
  return index
}

/**
 * Expand selection to line boundaries
 * GitHub: index.ts line 502-515
 * CRITICAL: This modifies the textarea selection directly!
 */
export function expandSelectionToLine(textarea) {
  const lines = textarea.value.split('\n')
  let counter = 0
  for (let index = 0; index < lines.length; index++) {
    const lineLength = lines[index].length + 1
    if (textarea.selectionStart >= counter && textarea.selectionStart < counter + lineLength) {
      textarea.selectionStart = counter
    }
    if (textarea.selectionEnd >= counter && textarea.selectionEnd < counter + lineLength) {
      textarea.selectionEnd = counter + lineLength - 1
    }
    counter += lineLength
  }
}

/**
 * Expand selected text
 * GitHub: index.ts line 517-537
 * CRITICAL: This modifies the textarea selection to include format markers if they exist
 */
export function expandSelectedText(textarea, prefixToUse, suffixToUse, multiline = false) {
  if (textarea.selectionStart === textarea.selectionEnd) {
    textarea.selectionStart = wordSelectionStart(textarea.value, textarea.selectionStart)
    textarea.selectionEnd = wordSelectionEnd(textarea.value, textarea.selectionEnd, multiline)
  } else {
    const expandedSelectionStart = textarea.selectionStart - prefixToUse.length
    const expandedSelectionEnd = textarea.selectionEnd + suffixToUse.length
    const beginsWithPrefix = textarea.value.slice(expandedSelectionStart, textarea.selectionStart) === prefixToUse
    const endsWithSuffix = textarea.value.slice(textarea.selectionEnd, expandedSelectionEnd) === suffixToUse
    if (beginsWithPrefix && endsWithSuffix) {
      textarea.selectionStart = expandedSelectionStart
      textarea.selectionEnd = expandedSelectionEnd
    }
  }
  return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
}

/**
 * Calculate newlines to surround selected text
 * GitHub: index.ts line 544-573
 */
export function newlinesToSurroundSelectedText(textarea) {
  const beforeSelection = textarea.value.slice(0, textarea.selectionStart)
  const afterSelection = textarea.value.slice(textarea.selectionEnd)

  const breaksBefore = beforeSelection.match(/\n*$/)
  const breaksAfter = afterSelection.match(/^\n*/)
  const newlinesBeforeSelection = breaksBefore ? breaksBefore[0].length : 0
  const newlinesAfterSelection = breaksAfter ? breaksAfter[0].length : 0

  let newlinesToAppend
  let newlinesToPrepend

  if (beforeSelection.match(/\S/) && newlinesBeforeSelection < 2) {
    newlinesToAppend = repeat('\n', 2 - newlinesBeforeSelection)
  }

  if (afterSelection.match(/\S/) && newlinesAfterSelection < 2) {
    newlinesToPrepend = repeat('\n', 2 - newlinesAfterSelection)
  }

  if (newlinesToAppend == null) {
    newlinesToAppend = ''
  }

  if (newlinesToPrepend == null) {
    newlinesToPrepend = ''
  }

  return { newlinesToAppend, newlinesToPrepend }
}

/**
 * Preserve selection helper (not in GitHub's but useful)
 */
export function preserveSelection(textarea, callback) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const scrollTop = textarea.scrollTop
  
  callback()
  
  textarea.selectionStart = start
  textarea.selectionEnd = end
  textarea.scrollTop = scrollTop
}