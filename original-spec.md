# Markdown Toolbar Library - Functional API Specification

## Overview

A lightweight, zero-dependency JavaScript library for adding markdown formatting capabilities to any textarea element. Based on GitHub's proven markdown-toolbar-element implementation, simplified to a functional API that's framework-agnostic and tree-shakeable.

## Core Principles

1. **No state management** - All functions are pure operations on textarea elements
2. **No UI components** - Only text manipulation logic, bring your own UI
3. **Browser-native undo** - Integrates with browser's undo/redo stack
4. **Smart selection** - Intelligent selection expansion and cursor positioning
5. **Format toggling** - Detect and toggle existing formatting

## API Reference

### Primary Formatting Functions

#### `toggleBold(textarea: HTMLTextAreaElement): void`
Toggles bold markdown formatting (`**text**`) on selected text or at cursor position.

**Behavior:**
- If text selected: Wraps selection in `**` markers
- If no selection: Inserts `****` and places cursor in middle
- If cursor inside bold text: Removes the `**` markers
- If bold markers selected with text: Removes the markers

**Example:**
```javascript
// Before: "Hello |world|" (selected)
toggleBold(textarea)
// After: "Hello **world**" (cursor after closing **)

// Before: "Hello **|world|**" (cursor inside)
toggleBold(textarea)  
// After: "Hello world" (cursor maintained)
```

---

#### `toggleItalic(textarea: HTMLTextAreaElement): void`
Toggles italic markdown formatting (`_text_`) on selected text or at cursor position.

**Behavior:**
- If text selected: Wraps selection in `_` markers
- If no selection: Inserts `__` and places cursor in middle
- If cursor inside italic text: Removes the `_` markers
- If italic markers selected with text: Removes the markers

**Example:**
```javascript
// Before: "Hello |world|" (selected)
toggleItalic(textarea)
// After: "Hello _world_" (cursor after closing _)
```

---

#### `toggleStrikethrough(textarea: HTMLTextAreaElement): void`
Toggles strikethrough markdown formatting (`~~text~~`) on selected text or at cursor position.

**Behavior:**
- Same as bold/italic but with `~~` markers

---

#### `toggleCode(textarea: HTMLTextAreaElement): void`
Toggles inline code formatting (`code`) or code block (```code```) based on selection.

**Behavior:**
- Single line selection: Wraps in backticks
- Multi-line selection: Wraps in triple backticks with newlines
- Toggle removes existing backticks

**Example:**
```javascript
// Single line - Before: "|const x = 5|"
toggleCode(textarea)
// After: "`const x = 5`"

// Multi-line - Before: "|line1\nline2|"  
toggleCode(textarea)
// After: "```\nline1\nline2\n```"
```

---

#### `insertLink(textarea: HTMLTextAreaElement, options?: LinkOptions): void`
Inserts or wraps selection as a markdown link.

**Options:**
```typescript
interface LinkOptions {
  url?: string        // Specific URL to use
  text?: string       // Link text to use
  autoDetect?: boolean // Auto-detect if selection is URL (default: true)
}
```

**Behavior:**
- If URL selected: Creates `[Link text](selected_url)` 
- If text selected: Creates `[selected_text](url)`
- If no selection: Inserts `[Link text](url)` with smart cursor placement
- If cursor in existing link: Removes link formatting

**Example:**
```javascript
// Before: "|https://example.com|" (URL selected)
insertLink(textarea)
// After: "[Link text](https://example.com)" (cursor selects "Link text")

// Before: "|Click here|" (text selected)  
insertLink(textarea)
// After: "[Click here](url)" (cursor selects "url")

// With options
insertLink(textarea, { url: 'https://github.com' })
```

---

#### `insertImage(textarea: HTMLTextAreaElement, options?: ImageOptions): void`
Inserts markdown image syntax.

**Options:**
```typescript
interface ImageOptions {
  url?: string      // Image URL
  alt?: string      // Alt text
}
```

**Behavior:**
- Similar to insertLink but with `![alt](url)` format

---

#### `toggleBulletList(textarea: HTMLTextAreaElement): void`
Toggles bullet list formatting on current line(s).

**Behavior:**
- Adds `- ` prefix to current line or all selected lines
- If already bulleted: Removes prefix
- If numbered list: Converts to bullet list
- Multi-line preserves individual line items

**Example:**
```javascript
// Before: "Item one|" (cursor at end)
toggleBulletList(textarea)
// After: "- Item one"

// Before: "- Item one|"
toggleBulletList(textarea)  
// After: "Item one"

// Before: "1. Item one|"
toggleBulletList(textarea)
// After: "- Item one"
```

---

#### `toggleNumberedList(textarea: HTMLTextAreaElement): void`
Toggles numbered list formatting on current line(s).

**Behavior:**
- Adds `1. `, `2. `, etc. prefix to lines
- Auto-increments numbers for multiple lines
- If already numbered: Removes prefix
- If bullet list: Converts to numbered list

**Example:**
```javascript
// Multi-line - Before: "|Item one\nItem two\nItem three|"
toggleNumberedList(textarea)
// After: "1. Item one\n2. Item two\n3. Item three"
```

---

#### `toggleTaskList(textarea: HTMLTextAreaElement): void`
Toggles task list formatting (`- [ ]`) on current line(s).

**Behavior:**
- Adds `- [ ] ` prefix for unchecked task
- Removes if already a task list
- Preserves checked state if existing

---

#### `toggleQuote(textarea: HTMLTextAreaElement): void`
Toggles blockquote formatting on selected line(s).

**Behavior:**
- Adds `> ` prefix to each line
- Multi-line selection quotes each line
- Toggle removes quote markers
- Adds surrounding newlines if needed for block separation

**Example:**
```javascript
// Before: "|This is\na quote|"
toggleQuote(textarea)
// After: "> This is\n> a quote"
```

---

#### `insertHeader(textarea: HTMLTextAreaElement, level: 1-6): void`
Inserts or toggles header formatting.

**Behavior:**
- Adds appropriate number of `#` symbols
- Replaces existing header level if present
- Places cursor at end of line

**Example:**
```javascript
// Before: "|Title|"
insertHeader(textarea, 1)
// After: "# Title"

// Before: "## Title|"
insertHeader(textarea, 1)  
// After: "# Title"
```

---

### Utility Functions

#### `getActiveFormats(textarea: HTMLTextAreaElement): string[]`
Returns array of active format names at current cursor position.

**Returns:** Array of format names: `['bold', 'italic', 'link', 'bullet-list', ...]`

**Example:**
```javascript
// With cursor in: "**Hello _wo|rld_**"
getActiveFormats(textarea)
// Returns: ['bold', 'italic']
```

---

#### `hasFormat(textarea: HTMLTextAreaElement, format: string): boolean`
Checks if specific format is active at cursor position.

**Example:**
```javascript
// With cursor in: "**Hello| world**"
hasFormat(textarea, 'bold')  // Returns: true
hasFormat(textarea, 'italic') // Returns: false
```

---

#### `expandSelection(textarea: HTMLTextAreaElement, options?: ExpansionOptions): void`
Expands current selection based on criteria.

**Options:**
```typescript
interface ExpansionOptions {
  toWord?: boolean      // Expand to word boundaries
  toLine?: boolean      // Expand to line boundaries  
  toFormat?: boolean    // Expand to format markers
}
```

**Example:**
```javascript
// Before: "Hello wo|rld" (cursor in word)
expandSelection(textarea, { toWord: true })
// After: "Hello |world|" (word selected)
```

---

#### `applyCustomFormat(textarea: HTMLTextAreaElement, format: CustomFormat): void`
Apply custom markdown formatting rules.

**Format Definition:**
```typescript
interface CustomFormat {
  prefix: string
  suffix?: string
  multiline?: boolean        // Apply to each line separately
  trimWhitespace?: boolean   // Trim selection before wrapping
  surroundWithNewlines?: boolean // Add newlines for block-level
  replaceSelection?: string  // Replace selection with this
}
```

**Example:**
```javascript
// Custom highlight format
applyCustomFormat(textarea, {
  prefix: '==',
  suffix: '==',
  trimWhitespace: true
})

// Custom keyboard emoji
applyCustomFormat(textarea, {
  prefix: ':',
  suffix: ':',
})
```

---

### Configuration Functions

#### `setUndoMethod(method: 'native' | 'manual' | 'auto'): void`
Configure how undo/redo integration works.

- `'native'`: Use document.execCommand (default)
- `'manual'`: Direct value manipulation
- `'auto'`: Try native, fallback to manual

---

#### `preserveSelection(textarea: HTMLTextAreaElement, callback: Function): void`
Utility to preserve selection while performing operations.

**Example:**
```javascript
preserveSelection(textarea, () => {
  // Perform operations that might affect focus
  document.getElementById('preview').innerHTML = marked(textarea.value)
})
```

---

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Full support with touch events

**Required APIs:**
- `HTMLTextAreaElement.selectionStart/End`
- `HTMLTextAreaElement.setSelectionRange()`
- `document.execCommand()` (optional, for undo support)

## Usage Examples

### Basic Toolbar Implementation

```javascript
import * as markdownToolbar from 'markdown-toolbar'

// Bind to buttons
document.getElementById('bold-btn').addEventListener('click', () => {
  markdownToolbar.toggleBold(textarea)
  updateButtonStates()
})

// Update button states
function updateButtonStates() {
  const formats = markdownToolbar.getActiveFormats(textarea)
  document.getElementById('bold-btn').classList.toggle('active', 
    formats.includes('bold'))
}

// Listen for selection changes
textarea.addEventListener('selectionchange', updateButtonStates)
textarea.addEventListener('keyup', updateButtonStates)
```

### React Integration

```javascript
import * as mt from 'markdown-toolbar'

function MarkdownEditor() {
  const textareaRef = useRef()
  const [activeFormats, setActiveFormats] = useState([])
  
  const updateFormats = () => {
    setActiveFormats(mt.getActiveFormats(textareaRef.current))
  }
  
  return (
    <>
      <button 
        className={activeFormats.includes('bold') ? 'active' : ''}
        onClick={() => {
          mt.toggleBold(textareaRef.current)
          updateFormats()
        }}>
        Bold
      </button>
      <textarea 
        ref={textareaRef}
        onSelect={updateFormats}
        onKeyUp={updateFormats}
      />
    </>
  )
}
```

### Custom Keyboard Shortcuts

```javascript
textarea.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'b':
        e.preventDefault()
        markdownToolbar.toggleBold(textarea)
        break
      case 'i':
        e.preventDefault()
        markdownToolbar.toggleItalic(textarea)
        break
      case 'k':
        e.preventDefault()
        markdownToolbar.insertLink(textarea)
        break
    }
  }
})
```

## Package Structure

```
markdown-toolbar/
├── dist/
│   ├── index.js         # UMD build
│   ├── index.esm.js     # ES modules build  
│   ├── index.d.ts       # TypeScript definitions
│   └── index.min.js     # Minified UMD
├── src/
│   ├── index.ts         # Main exports
│   ├── formats.ts       # Format definitions
│   ├── selection.ts     # Selection utilities
│   └── operations.ts    # Text operations
└── package.json
```

## Size & Performance

- **Bundle size**: ~3-4kb minified + gzipped
- **Zero dependencies**
- **Tree-shakeable**: Import only what you need
- **Performance**: O(n) where n is selection length
- **Memory**: No persistent state or memory leaks

## Migration from GitHub's markdown-toolbar-element

```javascript
// Before (Web Component)
<markdown-toolbar for="textarea-id">
  <md-bold>Bold</md-bold>
</markdown-toolbar>

// After (Functional)
<button onclick="markdownToolbar.toggleBold(textarea)">Bold</button>
```

## Error Handling

All functions are safe and will silently fail if:
- Textarea is not provided or not valid
- Textarea is disabled or readonly
- Selection is out of bounds

Functions never throw errors, maintaining stability.

## Testing Strategy

Each function should be tested for:
1. Basic operation (empty, with selection, without selection)
2. Toggle behavior (apply and remove)
3. Cursor positioning
4. Multi-line handling where applicable
5. Edge cases (empty textarea, max length, special characters)
6. Undo/redo integration

## Future Considerations

Possible extensions that maintain functional approach:
- Table formatting support
- Custom macro system
- Markdown preview sync utilities
- Selection history tracking
- Format validation utilities