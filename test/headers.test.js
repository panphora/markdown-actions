import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actions, textarea, run, active } from './helpers.js'

const deepHeaders = [
  [4, actions.toggleH4, '#### '],
  [5, actions.toggleH5, '##### '],
  [6, actions.toggleH6, '###### ']
]

for (const [level, toggle, prefix] of deepHeaders) {
  test(`toggleH${level} turns the caret's line into a heading and keeps the caret on its text`, () => {
    assert.equal(run('Ti|tle', toggle), `${prefix}Ti|tle`)
    assert.equal(run('|', toggle), `${prefix}|`)
    assert.equal(run('above\nTi|tle\nbelow', toggle), `above\n${prefix}Ti|tle\nbelow`)
  })

  test(`toggleH${level} keeps a selection on the same text`, () => {
    assert.equal(run('The |Title| here', toggle), `${prefix}The |Title| here`)
  })

  test(`toggleH${level} toggles off on a heading of the same level`, () => {
    assert.equal(run(`${prefix}Ti|tle`, toggle), 'Ti|tle')
    assert.equal(run(`above\n${prefix}Ti|tle\nbelow`, toggle), 'above\nTi|tle\nbelow')
    assert.equal(run(`${prefix}The |Title| here`, toggle), 'The |Title| here')
  })

  test(`toggleH${level} replaces a heading of another level`, () => {
    assert.equal(run('# Ti|tle', toggle), `${prefix}Ti|tle`)
    assert.equal(run('### Ti|tle', toggle), `${prefix}Ti|tle`)
    const other = level === 6 ? '#### ' : '###### '
    assert.equal(run(`${other}Ti|tle`, toggle), `${prefix}Ti|tle`)
  })

  test(`H1 to H3 replace an H${level} heading`, () => {
    assert.equal(run(`${prefix}Ti|tle`, actions.toggleH1), '# Ti|tle')
    assert.equal(run(`${prefix}Ti|tle`, actions.toggleH2), '## Ti|tle')
    assert.equal(run(`${prefix}Ti|tle`, actions.toggleH3), '### Ti|tle')
  })

  test(`active formats report header-${level}`, () => {
    assert.deepEqual(active(`${prefix}Ti|tle`), [`header-${level}`])
    assert.deepEqual(active(`above\n${prefix}Ti|tle`), [`header-${level}`])
  })

  test(`toggleH${level} is on the default export and matches insertHeader`, () => {
    assert.equal(actions.default[`toggleH${level}`], toggle)
    assert.equal(run('Ti|tle', area => actions.insertHeader(area, level)), `${prefix}Ti|tle`)
    assert.equal(run(`${prefix}Ti|tle`, area => actions.insertHeader(area, level)), `${prefix}Ti|tle`)
  })

  test(`toggleH${level} leaves a textarea that cannot be edited alone`, () => {
    for (const property of ['readOnly', 'disabled']) {
      textarea[property] = true
      try {
        assert.equal(run('Ti|tle', toggle), 'Ti|tle')
      } finally {
        textarea[property] = false
      }
    }
  })
}

test('active formats keep the names of H1 to H3', () => {
  assert.deepEqual(active('# Ti|tle'), ['header'])
  assert.deepEqual(active('## Ti|tle'), ['header-2'])
  assert.deepEqual(active('### Ti|tle'), ['header-3'])
})

test('active formats report no heading for text that is not one', () => {
  assert.deepEqual(active('####### Ti|tle'), [])
  assert.deepEqual(active('####Ti|tle'), [])
  assert.deepEqual(active('Ti|tle #### not'), [])
  assert.deepEqual(active('#### above\nTi|tle'), [])
})
