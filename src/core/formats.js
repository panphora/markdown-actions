/**
 * Format definitions for markdown syntax
 */

export const FORMATS = {
  bold: {
    prefix: '**',
    suffix: '**',
    trimFirst: true
  },
  italic: {
    prefix: '_',
    suffix: '_',
    trimFirst: true
  },
  code: {
    prefix: '`',
    suffix: '`',
    blockPrefix: '```',
    blockSuffix: '```'
  },
  link: {
    prefix: '[',
    suffix: '](url)',
    replaceNext: 'url',
    scanFor: 'https?://'
  },
  bulletList: {
    prefix: '- ',
    multiline: true,
    unorderedList: true
  },
  numberedList: {
    prefix: '1. ',
    multiline: true,
    orderedList: true
  },
  quote: {
    prefix: '> ',
    multiline: true,
    surroundWithNewlines: true
  },
  taskList: {
    prefix: '- [ ] ',
    multiline: true,
    surroundWithNewlines: true
  },
  header1: { prefix: '# ' },
  header2: { prefix: '## ' },
  header3: { prefix: '### ' },
  header4: { prefix: '#### ' },
  header5: { prefix: '##### ' },
  header6: { prefix: '###### ' }
}

/**
 * Default style configuration
 */
export function getDefaultStyle() {
  return {
    prefix: '',
    suffix: '',
    blockPrefix: '',
    blockSuffix: '',
    multiline: false,
    replaceNext: '',
    prefixSpace: false,
    scanFor: '',
    surroundWithNewlines: false,
    orderedList: false,
    unorderedList: false,
    trimFirst: false
  }
}

/**
 * Merge format with defaults
 */
export function mergeWithDefaults(format) {
  return { ...getDefaultStyle(), ...format }
}