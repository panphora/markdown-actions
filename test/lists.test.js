import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actions, run } from './helpers.js'

const lists = [
  ['task', actions.toggleTaskList, '- [ ] '],
  ['bullet', actions.toggleBulletList, '- '],
  ['numbered', actions.toggleNumberedList, '1. ']
]

for (const [name, toggle, prefix] of lists) {
  test(`${name} list starts on the empty line under a list item`, () => {
    assert.equal(run('- [ ] Google\n|', toggle), `- [ ] Google\n${prefix}|`)
    assert.equal(run('- one\n|\nafter', toggle), `- one\n${prefix}|\nafter`)
  })

  test(`${name} list starts on a line between two paragraph lines`, () => {
    assert.equal(run('above\nmid|dle\nbelow', toggle), `above\n${prefix}mid|dle\nbelow`)
  })

  test(`${name} list wraps every selected line in place`, () => {
    assert.equal(run('above\n|a\nb|\nbelow', toggle), `above\n|${prefix}a\n${name === 'numbered' ? '2. ' : prefix}b|\nbelow`)
  })

  test(`${name} list toggles off on the same line`, () => {
    assert.equal(run(`above\n${prefix}te|xt\nbelow`, toggle), 'above\nte|xt\nbelow')
  })
}

test('a selected list toggles off and keeps the selection on the text', () => {
  assert.equal(run('above\n|- [ ] a\n- [ ] b|\nbelow', actions.toggleTaskList), 'above\n|a\nb|\nbelow')
  assert.equal(run('above\n- o|ne\n- tw|o\nbelow', actions.toggleBulletList), 'above\no|ne\ntw|o\nbelow')
  assert.equal(run('above\n1. o|ne\n2. tw|o\nbelow', actions.toggleNumberedList), 'above\no|ne\ntw|o\nbelow')
})
