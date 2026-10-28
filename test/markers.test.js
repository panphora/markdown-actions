import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const { window } = new JSDOM('<textarea></textarea>')
globalThis.document = window.document
globalThis.Event = window.Event
globalThis.CustomEvent = window.CustomEvent
const actions = await import('../src/index.js')

function run(text, caret, fn, options) {
  const textarea = window.document.querySelector('textarea')
  const marked = text.indexOf('|')
  const end = text.indexOf('|', marked + 1)
  textarea.value = text.replace(/\|/g, '')
  textarea.selectionStart = marked
  textarea.selectionEnd = end === -1 ? marked : end - 1
  fn(textarea, options)
  const { value, selectionStart, selectionEnd } = textarea
  return selectionStart === selectionEnd
    ? value.slice(0, selectionStart) + '|' + value.slice(selectionStart)
    : value.slice(0, selectionStart) + '|' + value.slice(selectionStart, selectionEnd) + '|' + value.slice(selectionEnd)
}

const italic = (text, marker) => run(text, null, actions.toggleItalic, marker && { marker })
const bold = (text, marker) => run(text, null, actions.toggleBold, marker && { marker })
const bullet = (text, marker) => run(text, null, actions.toggleBulletList, marker && { marker })

test('italic writes underscores by default and stars on request', () => {
  assert.equal(italic('That is the cu|test thing.'), 'That is the _cu|test_ thing.')
  assert.equal(italic('That is the cu|test thing.', '*'), 'That is the *cu|test* thing.')
  assert.equal(italic('That is the |cutest| thing.', '*'), 'That is the *|cutest|* thing.')
})

test('an unknown marker falls back to the default', () => {
  assert.equal(italic('a wo|rd', '~'), 'a _wo|rd_')
  assert.equal(bold('a wo|rd', '*'), 'a **wo|rd**')
  assert.equal(bullet('it|em', '#'), '- it|em')
})

test('italic removes either spelling, whatever marker is chosen', () => {
  assert.equal(italic('the _cu|test_ thing', '*'), 'the cu|test thing')
  assert.equal(italic('the *cu|test* thing'), 'the cu|test thing')
  assert.equal(italic('the |*cutest*| thing'), 'the |cutest| thing')
  assert.equal(italic('the *cu|test*.'), 'the cu|test.')
})

test('italic with stars never eats a bold star', () => {
  assert.equal(italic('Otters **ho|ld** hands', '*'), 'Otters ***ho|ld*** hands')
  assert.equal(italic('Otters ***ho|ld*** hands', '*'), 'Otters **ho|ld** hands')
  assert.equal(italic('Otters **|hold|** hands', '*'), 'Otters ***|hold|*** hands')
  assert.equal(italic('Otters __ho|ld__ hands', '_'), 'Otters ___ho|ld___ hands')
})

test('bold writes and removes both spellings', () => {
  assert.equal(bold('a wo|rd'), 'a **wo|rd**')
  assert.equal(bold('a wo|rd', '__'), 'a __wo|rd__')
  assert.equal(bold('a __wo|rd__'), 'a wo|rd')
  assert.equal(bold('a **wo|rd**', '__'), 'a wo|rd')
  assert.equal(bold('a *wo|rd*'), 'a ***wo|rd***')
  assert.equal(bold('a ***wo|rd***'), 'a *wo|rd*')
  assert.equal(bold('a **_wo|rd_**'), 'a _wo|rd_')
})

test('toggling on empty space inserts a pair', () => {
  assert.equal(italic('a | b', '*'), 'a *|* b')
})

test('bullet lists write the chosen marker and remove any marker', () => {
  assert.equal(bullet('it|em'), '- it|em')
  assert.equal(bullet('it|em', '*'), '* it|em')
  assert.equal(bullet('it|em', '+'), '+ it|em')
  assert.equal(bullet('* it|em'), 'it|em')
  assert.equal(bullet('+ it|em', '-'), 'it|em')
  const text = result => result.replace(/\|/g, '')
  assert.equal(text(bullet('|one\ntwo|')), '- one\n- two')
  assert.equal(text(bullet('|one\ntwo|', '*')), '* one\n* two')
  assert.equal(text(bullet('|* one\n- two|')), 'one\ntwo')
})

test('active formats recognize every spelling', () => {
  const active = text => {
    const textarea = window.document.querySelector('textarea')
    const at = text.indexOf('|')
    textarea.value = text.replace('|', '')
    textarea.selectionStart = textarea.selectionEnd = at
    return actions.getActiveFormats(textarea)
  }
  assert.ok(active('a *wo|rd* b').includes('italic'))
  assert.ok(active('a _wo|rd_ b').includes('italic'))
  assert.ok(!active('a **wo|rd** b').includes('italic'))
  assert.ok(active('a **wo|rd** b').includes('bold'))
  assert.ok(active('a __wo|rd__ b').includes('bold'))
  assert.ok(!active('a __wo|rd__ b').includes('italic'))
  assert.ok(active('* it|em').includes('bullet-list'))
  assert.ok(active('+ it|em').includes('bullet-list'))
  assert.ok(active('* [ ] ta|sk').includes('task-list'))
})

test('detectMarkers finds the spelling a document already uses', () => {
  assert.deepEqual(actions.detectMarkers('plain text'), { bullet: null, bold: null, italic: null })
  assert.deepEqual(actions.detectMarkers('Hi *there* and __you__\n\n+ one\n- two'), { bullet: '+', bold: '__', italic: '*' })
  assert.deepEqual(actions.detectMarkers('**bold** then _it_\n* item'), { bullet: '*', bold: '**', italic: '_' })
  assert.equal(actions.detectMarkers('snake_case_name and **bold**').italic, null)
})
