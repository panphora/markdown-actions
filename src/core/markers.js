/**
 * Markdown spellings that mean the same thing
 */

export const MARKERS = {
  bold: ['**', '__'],
  italic: ['_', '*'],
  bullet: ['-', '*', '+']
}

/**
 * Return the marker if it is a standard spelling for this format, otherwise the default
 */
export function resolveMarker(kind, marker) {
  return MARKERS[kind].indexOf(marker) !== -1 ? marker : MARKERS[kind][0]
}

const DETECT = {
  bullet: /^[ \t]*([-*+])[ \t]+\S/m,
  bold: /(\*\*|__)(?=[^\s*_])[^\n]*?[^\s*_]\1/,
  italic: /(?:^|[^*_\w])([*_])(?=[^\s*_])[^\n*_]*?[^\s*_]\1(?![*_\w])/
}

/**
 * Find the spelling a document already uses for each format, or null when it uses none
 */
export function detectMarkers(text) {
  const found = {}
  Object.keys(DETECT).forEach(kind => {
    const match = DETECT[kind].exec(text || '')
    found[kind] = match ? match[1] : null
  })
  return found
}
