# Complete Trace of GitHub's markdown-toolbar-element List Operation

## Overview
This document traces EXACTLY what happens when a user clicks an unordered list button in GitHub's markdown-toolbar-element implementation, documenting every function call, every variable assignment, and every decision point.

## Initial Setup

### Button Configuration (Line 245-249)
```typescript
class MarkdownUnorderedListButtonElement extends MarkdownButtonElement {
  connectedCallback() {
    styles.set(this, {prefix: '- ', multiline: true, unorderedList: true})
  }
}
```
The button stores its style configuration: `{prefix: '- ', multiline: true, unorderedList: true}`

### Click Event Handler (Line 123-130)
```typescript
const apply = (event: Event) => {
  const style = styles.get(this)
  if (!style) return
  event.preventDefault()
  applyStyle(this, style)
}
this.addEventListener('click', apply)
```

## COMPLETE EXECUTION TRACE

### Step 1: User Clicks Button
- Event triggers `apply` function
- Retrieves style: `{prefix: '- ', multiline: true, unorderedList: true}`
- Calls `applyStyle(button, style)`

### Step 2: applyStyle Function (Lines 801-827)
```typescript
function applyStyle(button: Element, stylesToApply: Style) {
  const toolbar = button.closest('markdown-toolbar')
  if (!(toolbar instanceof MarkdownToolbarElement)) return

  const defaults = {
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

  const style = {...defaults, ...stylesToApply}

  const field = toolbar.field
  if (field) {
    field.focus()
    styleSelectedText(field, style)
  }
}
```

**What happens:**
1. Finds the parent toolbar element
2. Creates defaults object with ALL properties initialized
3. Merges defaults with button's style, resulting in:
   ```javascript
   style = {
     prefix: '- ',
     suffix: '',
     blockPrefix: '',
     blockSuffix: '',
     multiline: true,
     replaceNext: '',
     prefixSpace: false,
     scanFor: '',
     surroundWithNewlines: false,
     orderedList: false,
     unorderedList: true,
     trimFirst: false
   }
   ```
4. Gets the textarea from toolbar
5. Focuses the textarea
6. Calls `styleSelectedText(field, style)`

### Step 3: styleSelectedText Function (Lines 487-500)
```typescript
function styleSelectedText(textarea: HTMLTextAreaElement, styleArgs: StyleArgs) {
  const text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)

  let result
  if (styleArgs.orderedList || styleArgs.unorderedList) {
    result = listStyle(textarea, styleArgs)
  } else if (styleArgs.multiline && isMultipleLines(text)) {
    result = multilineStyle(textarea, styleArgs)
  } else {
    result = blockStyle(textarea, styleArgs)
  }

  insertText(textarea, result)
}
```

**What happens:**
1. Gets currently selected text
2. Since `styleArgs.unorderedList` is `true`, calls `listStyle(textarea, styleArgs)`
3. After getting result, calls `insertText(textarea, result)`

### Step 4: listStyle Function (Lines 730-784)

#### 4.1: Initial Setup
```typescript
function listStyle(textarea: HTMLTextAreaElement, style: StyleArgs): SelectionRange {
  const noInitialSelection = textarea.selectionStart === textarea.selectionEnd
  let selectionStart = textarea.selectionStart
  let selectionEnd = textarea.selectionEnd
```
- Checks if there's no selection (just cursor)
- Saves original selection positions

#### 4.2: Expand Selection to Line
```typescript
  expandSelectionToLine(textarea)
```
This modifies the textarea's selection directly!

**expandSelectionToLine (Lines 502-515):**
```typescript
function expandSelectionToLine(textarea: HTMLTextAreaElement) {
  const lines = textarea.value.split('\n')
  let counter = 0
  for (let index = 0; index < lines.length; index++) {
    const lineLength = lines[index].length + 1
    if (textarea.selectionStart >= counter && textarea.selectionStart < counter + lineLength) {
      textarea.selectionStart = counter
    }
    if (textarea.selectionEnd >= counter && textarea.selectionEnd < counter + lineLength) {
      textarea.selectionEnd = counter + lineLength - 1
    }
    counter += lineLength
  }
}
```

**CRITICAL**: This function DIRECTLY MODIFIES `textarea.selectionStart` and `textarea.selectionEnd`

Example with "Format toggling":
- Before: selectionStart=0, selectionEnd=0
- After: selectionStart=0, selectionEnd=15 (selecting whole line)

#### 4.3: Get Selected Text (After Expansion)
```typescript
  const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
```
Now gets the FULL LINE text

#### 4.4: Clear Existing List Style
```typescript
  const [undoResult, undoResultOpositeList, pristineText] = clearExistingListStyle(style, selectedText)
```

**clearExistingListStyle (Lines 714-728):**
```typescript
function clearExistingListStyle(style: StyleArgs, selectedText: string): [UndoResult, UndoResult, string] {
  let undoResultOpositeList: UndoResult
  let undoResult: UndoResult
  let pristineText
  if (style.orderedList) {
    undoResult = undoOrderedListStyle(selectedText)
    undoResultOpositeList = undoUnorderedListStyle(undoResult.text)
    pristineText = undoResultOpositeList.text
  } else {
    undoResult = undoUnorderedListStyle(selectedText)
    undoResultOpositeList = undoOrderedListStyle(undoResult.text)
    pristineText = undoResultOpositeList.text
  }
  return [undoResult, undoResultOpositeList, pristineText]
}
```

For unordered list, it:
1. Calls `undoUnorderedListStyle(selectedText)`
2. Then calls `undoOrderedListStyle` on the result
3. Returns all three results

**undoUnorderedListStyle (Lines 691-704):**
```typescript
function undoUnorderedListStyle(text: string): UndoResult {
  const lines = text.split('\n')
  const unorderedListPrefix = '- '
  const shouldUndoUnorderedList = lines.every(line => line.startsWith(unorderedListPrefix))
  let result = lines
  if (shouldUndoUnorderedList) {
    result = lines.map(line => line.slice(unorderedListPrefix.length, line.length))
  }

  return {
    text: result.join('\n'),
    processed: shouldUndoUnorderedList
  }
}
```

#### 4.5: Create Prefixed Lines
```typescript
  const prefixedLines = pristineText.split('\n').map((value, index) => {
    return `${makePrefix(index, style.unorderedList)}${value}`
  })
```

#### 4.6: Calculate Prefix Lengths
```typescript
  const totalPrefixLength = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
    return previousValue + makePrefix(currentIndex, style.unorderedList).length
  }, 0)

  const totalPrefixLengthOpositeList = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
    return previousValue + makePrefix(currentIndex, !style.unorderedList).length
  }, 0)
```

#### 4.7: Decision Point - Remove or Add List
```typescript
  if (undoResult.processed) {
    // REMOVING list formatting
    if (noInitialSelection) {
      selectionStart = Math.max(selectionStart - makePrefix(0, style.unorderedList).length, 0)
      selectionEnd = selectionStart
    } else {
      selectionStart = textarea.selectionStart
      selectionEnd = textarea.selectionEnd - totalPrefixLength
    }
    return {text: pristineText, selectionStart, selectionEnd}
  }
```

If the text already had the list format, return the pristine text (without list markers).

#### 4.8: Add List Formatting
```typescript
  const {newlinesToAppend, newlinesToPrepend} = newlinesToSurroundSelectedText(textarea)
  const text = newlinesToAppend + prefixedLines.join('\n') + newlinesToPrepend

  if (noInitialSelection) {
    selectionStart = Math.max(selectionStart + makePrefix(0, style.unorderedList).length + newlinesToAppend.length, 0)
    selectionEnd = selectionStart
  } else {
    if (undoResultOpositeList.processed) {
      selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0)
      selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength - totalPrefixLengthOpositeList
    } else {
      selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0)
      selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength
    }
  }

  return {text, selectionStart, selectionEnd}
```

### Step 5: insertText Function (Lines 446-485)

**CRITICAL**: At this point:
- The textarea's selection has been EXPANDED by `expandSelectionToLine`
- The result contains the new text and where the cursor should be AFTER insertion

```typescript
function insertText(textarea: HTMLTextAreaElement, {text, selectionStart, selectionEnd}: SelectionRange) {
  const originalSelectionStart = textarea.selectionStart
  const before = textarea.value.slice(0, originalSelectionStart)
  const after = textarea.value.slice(textarea.selectionEnd)
```

**KEY**: `originalSelectionStart` and `textarea.selectionEnd` are the EXPANDED positions!

```typescript
  if (canInsertText === null || canInsertText === true) {
    textarea.contentEditable = 'true'
    try {
      canInsertText = document.execCommand('insertText', false, text)
    } catch (error) {
      canInsertText = false
    }
    textarea.contentEditable = 'false'
  }

  if (canInsertText && !textarea.value.slice(0, textarea.selectionStart).endsWith(text)) {
    canInsertText = false
  }

  if (!canInsertText) {
    try {
      document.execCommand('ms-beginUndoUnit')
    } catch (e) {
      // Do nothing.
    }
    textarea.value = before + text + after
    try {
      document.execCommand('ms-endUndoUnit')
    } catch (e) {
      // Do nothing.
    }
    textarea.dispatchEvent(new CustomEvent('input', {bubbles: true, cancelable: true}))
  }

  if (selectionStart != null && selectionEnd != null) {
    textarea.setSelectionRange(selectionStart, selectionEnd)
  } else {
    textarea.setSelectionRange(originalSelectionStart, textarea.selectionEnd)
  }
}
```

## CRITICAL INSIGHTS

### 1. Selection Expansion Happens BEFORE Getting Text
- `expandSelectionToLine` modifies the textarea selection directly
- When `listStyle` gets the selected text, it's already the full line
- This expanded selection is what `insertText` uses to know what to replace

### 2. The StyleArgs Object Has ALL Properties
- GitHub always provides ALL properties with defaults
- Our implementation may be missing some properties

### 3. Order of Operations is Critical
1. Expand selection
2. Get expanded text
3. Process text
4. Call insertText with expanded selection still active
5. insertText replaces the expanded selection

### 4. insertText Uses Current Selection
- It uses `textarea.selectionStart` and `textarea.selectionEnd` which have been modified
- The `before` and `after` are calculated from these expanded positions
- This is why the replacement works correctly

## OUR IMPLEMENTATION PROBLEMS

### Problem 1: Selection State
Our implementation might be restoring or changing selection at the wrong time

### Problem 2: Missing Properties in Style Object
We need to ensure ALL properties are present with proper defaults

### Problem 3: insertText Verification
The line checking if execCommand worked:
```typescript
if (canInsertText && !textarea.value.slice(0, textarea.selectionStart).endsWith(text))
```
This might be incorrectly failing because after execCommand, the cursor position changes

### Problem 4: Double Insertion
If execCommand returns false but actually does something, and we then do manual insertion, we get duplication

## EXACT FLOW FOR "Format toggling" → "- Format toggling"

1. **Initial State**
   - Text: "Format toggling"
   - Selection: 0,0 (cursor at start)

2. **expandSelectionToLine**
   - Selection becomes: 0,15 (whole line selected)

3. **listStyle gets text**
   - selectedText = "Format toggling"

4. **Check for existing list**
   - Not a list, so will add "- "

5. **Create new text**
   - text = "- Format toggling"

6. **insertText called**
   - before = "" (text before position 0)
   - after = "" (text after position 15)
   - Replaces selection (0,15) with "- Format toggling"

7. **Result**
   - Text: "- Format toggling"

## EXACT FLOW FOR "- Format toggling" → "Format toggling"

1. **Initial State**
   - Text: "- Format toggling"
   - Selection: 2,2 (cursor after "- ")

2. **expandSelectionToLine**
   - Selection becomes: 0,17 (whole line selected)

3. **listStyle gets text**
   - selectedText = "- Format toggling"

4. **Check for existing list**
   - IS a list, so will remove "- "

5. **undoUnorderedListStyle**
   - Returns "Format toggling"

6. **Return early**
   - text = "Format toggling"
   - selectionStart/End calculated

7. **insertText called**
   - before = "" (text before position 0)
   - after = "" (text after position 17)
   - Replaces selection (0,17) with "Format toggling"

8. **Result**
   - Text: "Format toggling"