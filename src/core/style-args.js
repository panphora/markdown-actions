/**
 * Style arguments type definition and defaults
 * Matches GitHub's implementation exactly
 */

/**
 * Get default style arguments
 * MUST match GitHub's defaults exactly (index.ts lines 805-818)
 */
export function getDefaultStyleArgs() {
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
 * Merge style with defaults
 * Ensures ALL properties are present
 */
export function mergeStyleWithDefaults(style) {
  return { ...getDefaultStyleArgs(), ...style }
}