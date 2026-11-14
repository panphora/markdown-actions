import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actions, textarea, run, active } from './helpers.js'

const strike = text => run(text, actions.toggleStrikethrough)
const bold = text => run(text, actions.toggleBold)
const italic = text => run(text, actions.toggleItalic)

test('strikethrough wraps the word at the caret and keeps the caret in place', () => {
  assert.equal(strike('an ol|d price'), 'an ~~ol|d~~ price')
  assert.equal(strike('|old price'), '~~|old~~ price')
  assert.equal(strike('an old| price'), 'an ~~old|~~ price')
})

test('strikethrough wraps a selection and keeps it selected', () => {
  assert.equal(strike('an |old price| here'), 'an ~~|old price|~~ here')
  assert.equal(strike('an| old price |here'), 'an ~~|old price|~~ here')
})

test('strikethrough leaves the punctuation around a word outside', () => {
  assert.equal(strike('Was it (do|ne)?'), 'Was it (~~do|ne~~)?')
  assert.equal(strike('“Ol|d.”'), '“~~Ol|d~~.”')
})

test('strikethrough toggles off from the caret', () => {
  assert.equal(strike('an ~~ol|d~~ price'), 'an ol|d price')
  assert.equal(strike('an ~~ol|d~~, price'), 'an ol|d, price')
  assert.equal(strike('an ~~|old~~ price'), 'an |old price')
  assert.equal(strike('an ~~old~~| price'), 'an old| price')
})

test('strikethrough toggles off from a selection, with or without its markers', () => {
  assert.equal(strike('an ~~|old price|~~ here'), 'an |old price| here')
  assert.equal(strike('an |~~old price~~| here'), 'an |old price| here')
})

test('strikethrough removes the single tilde spelling', () => {
  assert.equal(strike('an ~ol|d~ price'), 'an ol|d price')
  assert.equal(strike('an |~old~| price'), 'an |old| price')
})

test('strikethrough on empty space inserts a pair, and a second toggle removes it', () => {
  assert.equal(strike('a | b'), 'a ~~|~~ b')
  assert.equal(strike('a ~~|~~ b'), 'a | b')
  assert.equal(strike('|'), '~~|~~')
  assert.equal(strike('~~|~~'), '|')
})

test('a tilde that is plain text is not read as a marker', () => {
  assert.equal(strike('about ~5 min|utes'), 'about ~5 ~~min|utes~~')
  assert.equal(bold('about ~|5 minutes'), 'about **~|5** minutes')
  assert.equal(italic('~/no|tes'), '_~/no|tes_')
})

test('tildes that do not make a strikethrough pair are left in place', () => {
  assert.equal(strike('a ~~~wo|rd~~~ b'), 'a ~~~~~wo|rd~~~~~ b')
  assert.equal(strike('a ~~~|word|~~~ b'), 'a ~~~~~|word|~~~~~ b')
  assert.equal(strike('a ~~|word|~ b'), 'a ~~~~|word|~~~ b')
})

test('one toggle removes the inner pair when the same marker wraps a word twice', () => {
  assert.equal(bold('**~~**wo|rd**~~**'), '**~~wo|rd~~**')
})

test('strikethrough goes inside bold and italic, and comes back out', () => {
  assert.equal(strike('a **wo|rd** b'), 'a **~~wo|rd~~** b')
  assert.equal(strike('a **~~wo|rd~~** b'), 'a **wo|rd** b')
  assert.equal(strike('a _wo|rd_ b'), 'a _~~wo|rd~~_ b')
  assert.equal(strike('a ~~**wo|rd**~~ b'), 'a **wo|rd** b')
  assert.equal(strike('a ~~***wo|rd***~~ b'), 'a ***wo|rd*** b')
})

test('bold and italic toggle through strikethrough in either order', () => {
  assert.equal(bold('a ~~wo|rd~~ b'), 'a ~~**wo|rd**~~ b')
  assert.equal(bold('a ~~**wo|rd**~~ b'), 'a ~~wo|rd~~ b')
  assert.equal(bold('a **~~wo|rd~~** b'), 'a ~~wo|rd~~ b')
  assert.equal(italic('a ~~wo|rd~~ b'), 'a ~~_wo|rd_~~ b')
  assert.equal(italic('a ~~_wo|rd_~~ b'), 'a ~~wo|rd~~ b')
  assert.equal(italic('a _~~wo|rd~~_ b'), 'a ~~wo|rd~~ b')
  assert.equal(bold('a ~~|word|~~ b'), 'a ~~**|word|**~~ b')
  assert.equal(bold('a ~~**|word|**~~ b'), 'a ~~|word|~~ b')
})

test('each of three formats on one word toggles off without touching the others', () => {
  const all = 'a _~~**wo|rd**~~_ b'
  assert.equal(strike(all), 'a _**wo|rd**_ b')
  assert.equal(bold(all), 'a _~~wo|rd~~_ b')
  assert.equal(italic(all), 'a ~~**wo|rd**~~ b')
  assert.equal(italic('a **_~~wo|rd~~_** b'), 'a **~~wo|rd~~** b')
  assert.equal(bold('a ~~**_wo|rd_**~~ b'), 'a ~~_wo|rd_~~ b')
})

test('a second toggle on an empty bold or italic pair removes it', () => {
  assert.equal(bold('a **|** b'), 'a | b')
  assert.equal(italic('a _|_ b'), 'a | b')
  assert.equal(italic('a *|* b'), 'a | b')
  assert.equal(italic('a **|** b'), 'a **_|_** b')
  assert.equal(strike('a **|** b'), 'a **~~|~~** b')
  assert.equal(strike('a **~~|~~** b'), 'a **|** b')
})

test('strikethrough leaves a textarea that cannot be edited alone', () => {
  for (const property of ['readOnly', 'disabled']) {
    textarea[property] = true
    try {
      assert.equal(strike('an ol|d price'), 'an ol|d price')
    } finally {
      textarea[property] = false
    }
  }
  assert.doesNotThrow(() => actions.toggleStrikethrough(null))
})

test('active formats report strikethrough between a matching pair of tildes', () => {
  assert.ok(active('an ~~ol|d~~ price').includes('strikethrough'))
  assert.ok(active('an ~ol|d~ price').includes('strikethrough'))
  assert.ok(active('an ~~old pr|ice~~ here').includes('strikethrough'))
  assert.ok(active('an ~~|old|~~ price').includes('strikethrough'))
  assert.ok(active('an ~~|old~~ price').includes('strikethrough'))
  assert.ok(active('a **~~wo|rd~~** b').includes('strikethrough'))
  assert.ok(active('first\nan ~~ol|d~~ price').includes('strikethrough'))
})

test('active formats do not report strikethrough outside a pair', () => {
  assert.ok(!active('an ol|d price').includes('strikethrough'))
  assert.ok(!active('~~one~~ t|wo ~~three~~').includes('strikethrough'))
  assert.ok(!active('an ~~old~~ pr|ice').includes('strikethrough'))
  assert.ok(!active('an |~~old~~| price').includes('strikethrough'))
  assert.ok(!active('an ~~ol|d~ price').includes('strikethrough'))
  assert.ok(!active('an ~~~ol|d~~~ price').includes('strikethrough'))
  assert.ok(!active('about ~5 min|utes').includes('strikethrough'))
  assert.ok(!active('~~above~~\nol|d\n~~below~~').includes('strikethrough'))
  assert.ok(!active('an ~~ol|d~~ price').includes('bold'))
})

test('toggleStrikethrough is on the default export', () => {
  assert.equal(actions.default.toggleStrikethrough, actions.toggleStrikethrough)
})
