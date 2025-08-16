# Implementation Differences Report: markdown-actions vs GitHub's markdown-toolbar-element

## Executive Summary

Our current implementation of markdown-actions has several critical differences from GitHub's original markdown-toolbar-element that are causing bugs and inconsistent behavior. The most significant issues are in list handling, text manipulation logic, and the overall approach to format toggling.

## Critical Differences

### 1. List Handling Issues

#### The Bug: "Format togglFormat togglinging"
**Root Cause**: Our implementation is not properly handling the text manipulation when removing list prefixes.

**GitHub's Implementation** (`index.ts`, line 697):
```javascript
result = lines.map(line => line.slice(unorderedListPrefix.length, line.length))
```

**Our Implementation** (`src/operations/list.js`, line 35):
```javascript
result = lines.map(line => line.slice(unorderedListPrefix.length))
```

While these look similar, the issue is in how we're calling the list operations. Our `applyListStyle` function doesn't properly coordinate with the selection expansion logic.

#### List Toggle Logic Discrepancy

**GitHub's Approach**:
- Uses `expandSelectionToLine()` to select the entire line(s)
- Checks if ALL lines have the list prefix before removing
- Properly calculates cursor position adjustments based on prefix lengths
- Returns clean text without duplication

**Our Approach**:
- Has the same functions but the integration is broken
- The `insertText` function is being called incorrectly with the list operations
- Selection restoration is happening at the wrong time

### 2. Missing/Incorrect `expandSelectedText` Implementation

**GitHub's Implementation** (`index.ts`, lines 517-537):
```typescript
function expandSelectedText(
  textarea: HTMLTextAreaElement,
  prefixToUse: string,
  suffixToUse: string,
  multiline = false
): string {
  if (textarea.selectionStart === textarea.selectionEnd) {
    textarea.selectionStart = wordSelectionStart(textarea.value, textarea.selectionStart)
    textarea.selectionEnd = wordSelectionEnd(textarea.value, textarea.selectionEnd, multiline)
  } else {
    const expandedSelectionStart = textarea.selectionStart - prefixToUse.length
    const expandedSelectionEnd = textarea.selectionEnd + suffixToUse.length
    const beginsWithPrefix = textarea.value.slice(expandedSelectionStart, textarea.selectionStart) === prefixToUse
    const endsWithSuffix = textarea.value.slice(textarea.selectionEnd, expandedSelectionEnd) === suffixToUse
    if (beginsWithPrefix && endsWithSuffix) {
      textarea.selectionStart = expandedSelectionStart
      textarea.selectionEnd = expandedSelectionEnd
    }
  }
  return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
}
```

**Our Implementation**:
We have this in `src/core/selection.js` but it's named `expandSelectedText` and it's not being used correctly in our block operations. This function is CRITICAL for proper format toggling.

### 3. Block Style Format Detection

**GitHub's Implementation** (`index.ts`, line 611):
```javascript
if (selectedText.startsWith(prefixToUse) && selectedText.endsWith(suffixToUse)) {
  // Remove formatting
  const replacementText = selectedText.slice(prefixToUse.length, selectedText.length - suffixToUse.length)
  // ... cursor position logic
  return {text: replacementText, selectionStart, selectionEnd}
}
```

**Our Implementation**:
Our `blockStyle` function in `src/operations/block.js` attempts to do this but the logic flow is different and doesn't properly handle the edge cases.

### 4. Text Insertion Method

**GitHub's Implementation** (`index.ts`, lines 446-485):
- Uses `document.execCommand('insertText')` for undo/redo support
- Has fallback for browsers without support
- Properly fires input events

**Our Implementation** (`src/core/insertion.js`):
We have a similar approach but our integration with the operation functions is causing issues. The text is being inserted multiple times or incorrectly.

### 5. Features We Implemented That Should Be Removed

According to the requirements, we should NOT support:
- **Strikethrough** (currently in `src/index.js` lines 36-41)
- **Images** (currently in `src/index.js` lines 99-120)
- **Task Lists** (currently in `src/index.js` lines 143-148)

### 6. Multiline Style Handling

**GitHub's Implementation** (`index.ts`, lines 648-670):
```javascript
function multilineStyle(textarea: HTMLTextAreaElement, arg: StyleArgs) {
  const {prefix, suffix, surroundWithNewlines} = arg
  let text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  // ... 
  const lines = text.split('\n')
  const undoStyle = lines.every(line => line.startsWith(prefix) && line.endsWith(suffix))
  
  if (undoStyle) {
    text = lines.map(line => line.slice(prefix.length, line.length - suffix.length)).join('\n')
  } else {
    text = lines.map(line => prefix + line + suffix).join('\n')
  }
  // ...
}
```

**Our Implementation**:
We have this function but it's not being used for quotes properly, and the integration is causing issues.

### 7. Style Configuration Structure

**GitHub's Format Definitions** (`index.ts`, lines 86-118):
```javascript
const manualStyles = {
  bold: {prefix: '**', suffix: '**', trimFirst: true},
  italic: {prefix: '_', suffix: '_', trimFirst: true},
  quote: {prefix: '> ', multiline: true, surroundWithNewlines: true},
  code: {prefix: '`', suffix: '`', blockPrefix: '```', blockSuffix: '```'},
  link: {prefix: '[', suffix: '](url)', replaceNext: 'url', scanFor: 'https?://'},
  'unordered-list': {prefix: '- ', multiline: true, unorderedList: true},
  'ordered-list': {prefix: '1. ', multiline: true, orderedList: true},
  // ...
}
```

**Our Format Definitions** (`src/core/formats.js`):
Our structure is similar but we're missing some properties and have extras we shouldn't have.

## Key Problems to Fix

### Problem 1: Text Duplication in List Operations
When toggling lists, text is being duplicated because:
1. The selection expansion is happening multiple times
2. The `insertText` function is being called with incorrect parameters
3. The original text isn't being properly replaced

### Problem 2: Incorrect Toggle Detection
The format detection for toggling on/off is not working correctly because:
1. We're not using `expandSelectedText` to check for existing formatting
2. The prefix/suffix detection logic is incomplete
3. Selection restoration happens at the wrong time

### Problem 3: Missing Cursor Position Logic
After operations, the cursor position is often wrong because:
1. We're not calculating the position adjustments based on added/removed characters
2. The selection range returned from operations isn't being applied correctly

## Recommended Fix Strategy

### Phase 1: Remove Unsupported Features
1. Remove `toggleStrikethrough` function and all references
2. Remove `insertImage` function and all references  
3. Remove `toggleTaskList` function and all references
4. Clean up format definitions to remove these formats

### Phase 2: Fix Core Selection and Expansion
1. Ensure `expandSelectedText` works exactly like GitHub's
2. Fix `expandSelectionToLine` to match GitHub's implementation
3. Verify `wordSelectionStart` and `wordSelectionEnd` match

### Phase 3: Fix Block Style Operations
1. Reimplement `blockStyle` to match GitHub's logic flow exactly
2. Ensure proper toggle detection (check if format exists, then remove)
3. Fix cursor positioning calculations

### Phase 4: Fix List Operations  
1. Ensure `listStyle` matches GitHub's implementation exactly
2. Fix the integration between `listStyle` and `insertText`
3. Verify undo operations work correctly

### Phase 5: Fix Text Insertion
1. Ensure `insertText` properly replaces selected text
2. Verify undo/redo integration works
3. Fix event firing

## Code Flow Comparison

### GitHub's Flow for Toggle Operations:
1. User clicks button → `applyStyle()` called
2. Expand selection if needed (`expandSelectedText`)
3. Check if format exists on selection
4. If exists: Remove format and return clean text
5. If not: Add format
6. Calculate new cursor position
7. Insert text with `insertText()`
8. Update selection range

### Our Current Flow (Broken):
1. User clicks button → toggle function called
2. Multiple operations happen (blockStyle, insertText)
3. Selection gets modified multiple times
4. Text gets duplicated or mangled
5. Cursor position is wrong

## Critical Functions to Align

These functions from GitHub's implementation need to be extracted exactly:

1. **Lines 419-443**: String utility functions
   - `isMultipleLines()`
   - `wordSelectionStart()`
   - `wordSelectionEnd()`

2. **Lines 502-515**: `expandSelectionToLine()`

3. **Lines 517-537**: `expandSelectedText()`

4. **Lines 544-573**: `newlinesToSurroundSelectedText()`

5. **Lines 581-646**: `blockStyle()` - CRITICAL

6. **Lines 648-670**: `multilineStyle()`

7. **Lines 676-704**: Undo list functions

8. **Lines 730-784**: `listStyle()` - CRITICAL

9. **Lines 446-485**: `insertText()` with proper execCommand

## Conclusion

Our implementation has diverged significantly from GitHub's proven approach. The main issues are:

1. **Integration problems** between different functions
2. **Missing or incorrect toggle detection** logic  
3. **Improper text replacement** causing duplication
4. **Features that shouldn't exist** (strikethrough, images, task lists)
5. **Cursor position calculations** are wrong

To fix these issues, we need to:
1. Remove unsupported features
2. Extract GitHub's functions more precisely
3. Ensure the same execution flow
4. Test each operation thoroughly

The "Format togglFormat togglinging" bug is symptomatic of these deeper integration issues. A proper fix requires aligning our implementation with GitHub's proven approach rather than patching individual symptoms.