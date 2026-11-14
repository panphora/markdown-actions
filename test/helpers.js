import { JSDOM } from 'jsdom'

const { window } = new JSDOM('<textarea></textarea>')
globalThis.document = window.document
globalThis.Event = window.Event
globalThis.CustomEvent = window.CustomEvent

export const actions = await import('../src/index.js')
export const textarea = window.document.querySelector('textarea')

// In the text, one | is the caret and two mark the ends of the selection
function place(text) {
  const start = text.indexOf('|')
  const end = text.indexOf('|', start + 1)
  textarea.value = text.replace(/\|/g, '')
  textarea.selectionStart = start
  textarea.selectionEnd = end === -1 ? start : end - 1
}

export function run(text, fn, options) {
  place(text)
  fn(textarea, options)
  const { value, selectionStart, selectionEnd } = textarea
  return selectionStart === selectionEnd
    ? value.slice(0, selectionStart) + '|' + value.slice(selectionStart)
    : value.slice(0, selectionStart) + '|' + value.slice(selectionStart, selectionEnd) + '|' + value.slice(selectionEnd)
}

export function active(text) {
  place(text)
  return actions.getActiveFormats(textarea)
}
