/**
 * Bold, italic and strikethrough toggles that understand every spelling (** and __, * and _, ~~ and ~)
 */

import { wordSelectionStart, wordSelectionEnd } from '../core/selection.js'

const isEmphasis = ch => ch === '*' || ch === '_'
const isMarker = ch => isEmphasis(ch) || ch === '~'
const OPENING_PUNCTUATION = /[(\[{"'“‘]/
const CLOSING_PUNCTUATION = /[.,;:!?)\]}"'”’]/

// For each format: the characters that spell it, and how many characters of a run of n carry it.
// A run of emphasis characters carries italic when n is odd and bold when n is at least 2.
// A run of one or two tildes is strikethrough, and a longer run is not.
const KINDS = {
  bold: { chars: ['*', '_'], size: n => (n >= 2 ? 2 : 0) },
  italic: { chars: ['*', '_'], size: n => n % 2 },
  strikethrough: { chars: ['~'], size: n => (n <= 2 ? n : 0) }
}

// The runs of one repeated character in value[from, to)
function runsBetween(value, from, to) {
  const runs = []
  for (let i = from; i < to; i++) {
    const last = runs[runs.length - 1]
    if (last && value[last.start] === value[i]) {
      last.end = i + 1
    } else {
      runs.push({ start: i, end: i + 1 })
    }
  }
  return runs
}

/**
 * Find the markers that already wrap value[start, end] as this format,
 * looking through the markers of other formats around the same text
 */
export function findWrap(value, start, end, kind) {
  let open = start
  while (open > 0 && isMarker(value[open - 1])) open--
  let close = end
  while (close < value.length && isMarker(value[close])) close++
  const before = runsBetween(value, open, start).reverse()
  const after = runsBetween(value, end, close)
  const sizeOf = run => KINDS[kind].size(run.end - run.start)

  for (const ch of KINDS[kind].chars) {
    const carries = run => value[run.start] === ch && sizeOf(run) > 0
    const opening = before.find(carries)
    const closing = after.find(carries)
    if (opening && closing && sizeOf(opening) === sizeOf(closing)) {
      const size = sizeOf(opening)
      return { open: opening.end - size, close: closing.start, size }
    }
  }
  return null
}

// Step inside the markers at the edges of value[start, end]. A tilde can also be plain text,
// as in "~5", so tildes only count as markers when as many close the text as open it.
function insideMarkers(value, start, end) {
  for (;;) {
    while (start < end && isEmphasis(value[start])) start++
    while (end > start && isEmphasis(value[end - 1])) end--
    let tildes = 0
    while (start + tildes < end && value[start + tildes] === '~') tildes++
    let closing = 0
    while (end - closing > start + tildes && value[end - 1 - closing] === '~') closing++
    if (tildes === 0 || tildes !== closing) return { start, end }
    start += tildes
    end -= tildes
  }
}

/**
 * The text an inline toggle acts on: the selection, or the word at the caret,
 * without surrounding punctuation or markers
 */
function targetRange(value, selectionStart, selectionEnd) {
  let start = selectionStart
  let end = selectionEnd
  const collapsed = start === end
  if (collapsed) {
    start = wordSelectionStart(value, start)
    end = wordSelectionEnd(value, end, false)
    while (start < end && OPENING_PUNCTUATION.test(value[start])) start++
    while (end > start && CLOSING_PUNCTUATION.test(value[end - 1])) end--
  }
  while (start < end && /\s/.test(value[start])) start++
  while (end > start && /\s/.test(value[end - 1])) end--
  const inside = insideMarkers(value, start, end)
  // A caret among markers with no text, as in the empty pair "**|**", acts where it stands
  if (collapsed && !/[^*_~]/.test(value.slice(inside.start, inside.end))) {
    return { start: selectionStart, end: selectionStart }
  }
  return inside
}

const clamp = (n, low, high) => Math.min(Math.max(n, low), high)

/**
 * Toggle bold, italic or strikethrough on the selection or the word at the caret.
 * Removes any spelling, and adds the given marker.
 */
export function inlineStyle(textarea, kind, marker) {
  const value = textarea.value
  const caretStart = textarea.selectionStart
  const caretEnd = textarea.selectionEnd
  const hadSelection = caretStart !== caretEnd
  const { start, end } = targetRange(value, caretStart, caretEnd)

  const wrap = findWrap(value, start, end, kind)
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
