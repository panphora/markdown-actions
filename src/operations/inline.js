/**
 * Bold and italic toggles that understand both spellings (** and __, * and _)
 */

import { wordSelectionStart, wordSelectionEnd } from '../core/selection.js'

const isEmphasis = ch => ch === '*' || ch === '_'
const OPENING_PUNCTUATION = /[(\[{"'“‘]/
const CLOSING_PUNCTUATION = /[.,;:!?)\]}"'”’]/

// A run of n emphasis characters carries italic when n is odd, and bold when n is at least 2
function carries(kind, n) {
  return kind === 'bold' ? n >= 2 : n % 2 === 1
}

function runLength(text, ch, fromEnd) {
  let n = 0
  while (n < text.length && text[fromEnd ? text.length - 1 - n : n] === ch) n++
  return n
}

/**
 * Find the markers that already wrap value[start, end] as this format
 */
export function findWrap(value, start, end, kind) {
  const size = kind === 'bold' ? 2 : 1
  let open = start
  while (open > 0 && isEmphasis(value[open - 1])) open--
  let close = end
  while (close < value.length && isEmphasis(value[close])) close++
  const before = value.slice(open, start)
  const after = value.slice(end, close)

  for (const ch of ['*', '_']) {
    if (carries(kind, runLength(before, ch, true)) && carries(kind, runLength(after, ch, false))) {
      return { open: start - size, close: end, size }
    }
    const outerBefore = runLength(before, ch, false)
    if (outerBefore < before.length && carries(kind, outerBefore) && carries(kind, runLength(after, ch, true))) {
      return { open, close: close - size, size }
    }
  }
  return null
}

/**
 * The text an inline toggle acts on: the selection, or the word at the caret,
 * without surrounding punctuation or emphasis markers
 */
function targetRange(value, selectionStart, selectionEnd) {
  let start = selectionStart
  let end = selectionEnd
  if (start === end) {
    start = wordSelectionStart(value, start)
    end = wordSelectionEnd(value, end, false)
    while (start < end && OPENING_PUNCTUATION.test(value[start])) start++
    while (end > start && CLOSING_PUNCTUATION.test(value[end - 1])) end--
  }
  while (start < end && /\s/.test(value[start])) start++
  while (end > start && /\s/.test(value[end - 1])) end--
  while (start < end && isEmphasis(value[start])) start++
  while (end > start && isEmphasis(value[end - 1])) end--
  return { start, end }
}

const clamp = (n, low, high) => Math.min(Math.max(n, low), high)

/**
 * Toggle bold or italic on the selection or the word at the caret.
 * Removes either spelling, and adds the given marker.
 */
export function inlineStyle(textarea, kind, marker) {
  const value = textarea.value
  const caretStart = textarea.selectionStart
  const caretEnd = textarea.selectionEnd
  const hadSelection = caretStart !== caretEnd
  const { start, end } = targetRange(value, caretStart, caretEnd)

  const wrap = start < end ? findWrap(value, start, end, kind) : null
  if (wrap) {
    textarea.selectionStart = wrap.open
    textarea.selectionEnd = wrap.close + wrap.size
    const newStart = start - wrap.size
    const newEnd = end - wrap.size
    const caret = clamp(caretStart - wrap.size, newStart, newEnd)
    return {
      text: value.slice(wrap.open + wrap.size, wrap.close),
      selectionStart: hadSelection ? newStart : caret,
      selectionEnd: hadSelection ? newEnd : caret
    }
  }

  textarea.selectionStart = start
  textarea.selectionEnd = end
  const caret = clamp(caretStart, start, end) + marker.length
  return {
    text: marker + value.slice(start, end) + marker,
    selectionStart: hadSelection ? start + marker.length : caret,
    selectionEnd: hadSelection ? end + marker.length : caret
  }
}
