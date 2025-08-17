# markdown-actions

A lightweight, zero-dependency JavaScript library for adding markdown formatting functionality to any textarea element. Extracted and refined from [GitHub's markdown-toolbar-element](https://github.com/github/markdown-toolbar-element).

## 🎯 What is this?

`markdown-actions` provides a simple, functional API for implementing markdown toolbar buttons that work with any `<textarea>`. It handles all the complex text manipulation, selection management, and cursor positioning that makes markdown editing feel natural.

### Key Features

- 🪶 **Lightweight** - ~3-4kb gzipped, zero dependencies
- 🎨 **Framework agnostic** - Works with React, Vue, vanilla JS, or any framework
- ⚡ **Simple API** - Just pass a textarea element to any function
- 🔄 **Smart toggling** - Automatically detects and removes existing formatting
- 📝 **Native undo/redo** - Integrates with browser's built-in undo stack
- 🎯 **Precise cursor control** - Maintains logical cursor position after operations
- 🌳 **Tree-shakeable** - Import only the functions you need

## 📖 Origin Story

This library was born from the need for a simple, reliable markdown toolbar implementation. After discovering that building a tokenizer-based approach led to complex state management and text corruption issues, we studied GitHub's battle-tested [markdown-toolbar-element](https://github.com/github/markdown-toolbar-element) and extracted its core logic.

The key insight: **you don't need to parse markdown to manipulate it effectively**. Instead of tokenizing, this library uses direct string manipulation with smart selection expansion - a simpler, more reliable approach proven in production on GitHub.com.

## 🚀 Quick Start

```html
<!-- Your HTML -->
<button id="bold-btn">Bold</button>
<textarea id="editor"></textarea>

<!-- Using the library -->
<script type="module">
  import { toggleBold } from './markdown-actions/src/index.js'
  
  const textarea = document.getElementById('editor')
  
  document.getElementById('bold-btn').addEventListener('click', () => {
    toggleBold(textarea)
    textarea.focus()
  })
</script>
```

## 📚 API Reference

### Formatting Functions

All functions take a `HTMLTextAreaElement` as their first parameter:

```javascript
toggleBold(textarea)           // **text**
toggleItalic(textarea)         // _text_
toggleCode(textarea)           // `code` or ```block```
toggleQuote(textarea)          // > quote
toggleBulletList(textarea)     // - item
toggleNumberedList(textarea)   // 1. item
insertLink(textarea, options)  // [text](url)
insertHeader(textarea, level)  // # Header
```

### Utility Functions

```javascript
// Get active formats at cursor position
getActiveFormats(textarea) // Returns: ['bold', 'italic', ...]

// Check if specific format is active
hasFormat(textarea, 'bold') // Returns: true/false

// Expand selection to word or line boundaries
expandSelection(textarea, { toWord: true })

// Apply custom markdown format
applyCustomFormat(textarea, {
  prefix: '==',
  suffix: '==',
  trimFirst: true
})
```

### Options

```javascript
// Link options
insertLink(textarea, {
  url: 'https://example.com',  // Pre-fill URL
  text: 'Link text'             // Pre-fill text
})
```

## 💡 Usage Examples

### React Component

```jsx
import { toggleBold, toggleItalic, getActiveFormats } from 'markdown-actions'

function MarkdownEditor() {
  const textareaRef = useRef()
  const [activeFormats, setActiveFormats] = useState([])
  
  const updateFormats = () => {
    setActiveFormats(getActiveFormats(textareaRef.current))
  }
  
  const handleBold = () => {
    toggleBold(textareaRef.current)
    updateFormats()
  }
  
  return (
    <>
      <button 
        className={activeFormats.includes('bold') ? 'active' : ''}
        onClick={handleBold}>
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

### Vue Component

```vue
<template>
  <div>
    <button @click="makeBold" :class="{ active: isBold }">Bold</button>
    <textarea ref="editor" @select="checkFormats"></textarea>
  </div>
</template>

<script>
import { toggleBold, hasFormat } from 'markdown-actions'

export default {
  data() {
    return {
      isBold: false
    }
  },
  methods: {
    makeBold() {
      toggleBold(this.$refs.editor)
      this.checkFormats()
    },
    checkFormats() {
      this.isBold = hasFormat(this.$refs.editor, 'bold')
    }
  }
}
</script>
```

### Keyboard Shortcuts

```javascript
textarea.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'b':
        e.preventDefault()
        toggleBold(textarea)
        break
      case 'i':
        e.preventDefault()
        toggleItalic(textarea)
        break
      case 'k':
        e.preventDefault()
        insertLink(textarea)
        break
    }
  }
})
```

### Custom Formats

```javascript
// Highlight format
applyCustomFormat(textarea, {
  prefix: '==',
  suffix: '==',
  trimFirst: true
})

// Spoiler format
applyCustomFormat(textarea, {
  prefix: '||',
  suffix: '||'
})

// Custom block format
applyCustomFormat(textarea, {
  prefix: '>>> ',
  multiline: true,
  surroundWithNewlines: true
})
```

## 🏗️ How It Works

Unlike complex tokenizer-based approaches, `markdown-actions` uses a simpler, more reliable method:

1. **Smart Selection** - Expands selections to word/line boundaries when needed
2. **Pattern Matching** - Simple string checks to detect existing formatting
3. **Direct Manipulation** - Modifies text directly without parsing
4. **Position Tracking** - Calculates new cursor positions based on changes
5. **Native Integration** - Uses `document.execCommand` for undo/redo support

This approach avoids the pitfalls of tokenization:
- No position corruption
- No text duplication
- No state management complexity
- No parsing edge cases

### 🎯 Selection Preservation - How Text Stays Selected

One of the most polished features of `markdown-actions` is how it preserves text selection after formatting. When you click "Bold" in a toolbar, the text stays selected, allowing for immediate additional formatting. Here's the step-by-step process:

#### Step 1: Capture Original Selection
```javascript
// In blockStyle() - src/operations/block.js:17-18
const originalSelectionStart = textarea.selectionStart
const originalSelectionEnd = textarea.selectionEnd
```

#### Step 2: Calculate New Selection After Formatting
When adding formatting (e.g., `**text**`):
```javascript
// src/operations/block.js:58-60
let replacementText = prefixToUse + selectedText + suffixToUse
selectionStart = originalSelectionStart + prefixToUse.length
selectionEnd = originalSelectionEnd + prefixToUse.length
```

When removing formatting (toggle off):
```javascript
// src/operations/block.js:46-54
const replacementText = selectedText.slice(prefixToUse.length, -suffixToUse.length)
if (originalSelectionStart === originalSelectionEnd) {
  // Cursor position (no selection)
  let position = originalSelectionStart - prefixToUse.length
  selectionStart = selectionEnd = position
} else {
  // Keep selection on unformatted text
  selectionEnd = selectionStart + replacementText.length
}
```

#### Step 3: Apply Text Change with Native Undo Support
```javascript
// In insertText() - src/core/insertion.js:24-31
textarea.contentEditable = 'true'
try {
  // Try native method first (preserves undo/redo)
  canInsertText = document.execCommand('insertText', false, text)
} catch (error) {
  canInsertText = false
}
textarea.contentEditable = 'false'
```

#### Step 4: Restore Selection at Calculated Position
```javascript
// src/core/insertion.js:56-60
if (selectionStart != null && selectionEnd != null) {
  textarea.setSelectionRange(selectionStart, selectionEnd)
} else {
  textarea.setSelectionRange(originalSelectionStart, textarea.selectionEnd)
}
```

#### Why This Matters
This careful selection management creates a professional editing experience:
- **Multiple formats**: Apply bold, then immediately italic without reselecting
- **Visual feedback**: See exactly what text is affected
- **Keyboard friendly**: Selection persists for keyboard shortcuts
- **Undo/redo aware**: Selection state is part of the undo stack

#### Example Flow
1. User selects "hello world"
2. User clicks Bold button
3. Text becomes "**hello world**"
4. "hello world" remains selected (without the ** markers)
5. User can immediately click Italic to get "**_hello world_**"

## 🧪 Testing

Open `test.html` in a browser to run the comprehensive test suite with 38 test cases covering:

- All formatting functions
- Edge cases and boundary conditions
- Selection management
- Format detection
- Custom formats

## 📦 Installation

```bash
npm install markdown-actions
```

Then import the functions you need:

```javascript
import { toggleBold, toggleItalic } from 'markdown-actions'
```

## ⚠️ Known Limitations

### Code Block Detection
Code format detection (`getActiveFormats`) currently has limitations with multi-line code blocks:
- Detection works reliably for inline code (`` `code` ``) 
- Detection inside code blocks (` ```code blocks``` `) is inconsistent
- The toggle functionality works correctly, but toolbar highlighting may be unreliable

**Workaround**: Consider disabling code format detection in toolbar implementations until this is resolved.

## 🤝 Contributing

Contributions are welcome! The codebase is intentionally simple and well-commented. Key files:

- `src/index.js` - Public API functions
- `src/core/` - Core utilities (selection, insertion, formats)
- `src/operations/` - Text manipulation logic
- `demo.html` - Interactive demonstration
- `test.html` - Test suite

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

This project is derived from [GitHub's markdown-toolbar-element](https://github.com/github/markdown-toolbar-element), which is also MIT licensed.

## 🙏 Credits

This library is based on the excellent work by GitHub, Inc. on [markdown-toolbar-element](https://github.com/github/markdown-toolbar-element).

**Original Copyright:** Copyright (c) 2017-2018 GitHub, Inc.

The core text manipulation logic, selection handling algorithms, and the approach to markdown formatting were extracted and adapted from GitHub's implementation. We're grateful for their decision to open-source this battle-tested code that powers markdown editing on GitHub.com.

### Key Contributors

- **GitHub, Inc.** - Original implementation and algorithms
- **markdown-toolbar-element contributors** - Ongoing improvements to the source implementation

## 🔮 Future Plans

- [ ] npm package publication
- [ ] TypeScript definitions
- [ ] Table formatting support
- [ ] Footnote support
- [ ] More custom format templates
- [ ] Plugin system for extensions
- [ ] Framework-specific wrappers (React hooks, Vue composables)

## 🐛 Known Issues

- Multi-cursor selection not supported (browser limitation)
- Some IME (Input Method Editor) edge cases with Asian languages
- Undo grouping may vary between browsers

## 📊 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

Requires: `HTMLTextAreaElement.selectionStart/End` and `setSelectionRange()`

---

Built with ❤️ using proven patterns from GitHub's markdown-toolbar-element