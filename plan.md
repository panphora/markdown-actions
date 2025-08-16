# Markdown Toolbar Library - Extraction & Implementation Plan

## Overview

This plan outlines the systematic extraction of core functionality from GitHub's markdown-toolbar-element to create a lightweight, functional API library as specified in spec.md.

## Phase 1: Core Extraction (Foundation)

### 1.1 Extract Essential Utilities
**Source:** `index.ts` lines 419-443, 517-573

**Extract:**
- `isMultipleLines()` - Check if selection spans multiple lines
- `wordSelectionStart()` - Find word boundary start
- `wordSelectionEnd()` - Find word boundary end  
- `expandSelectedText()` - Smart selection expansion
- `expandSelectionToLine()` - Expand to line boundaries
- `newlinesToSurroundSelectedText()` - Calculate block spacing

**Modifications needed:**
- Remove web component dependencies
- Convert to pure functions
- Simplify parameter passing

### 1.2 Extract Text Insertion System
**Source:** `index.ts` lines 446-485

**Extract:**
- `insertText()` function with execCommand support
- Fallback mechanism for browsers without execCommand
- Undo/redo integration logic

**Modifications needed:**
- Make it a standalone utility
- Add option to configure undo behavior
- Remove custom element references

### 1.3 Extract Format Definitions
**Source:** `index.ts` lines 86-118

**Extract:**
- Style configuration objects
- Prefix/suffix patterns for each format

**Transform to:**
```javascript
export const FORMATS = {
  bold: { prefix: '**', suffix: '**', trimFirst: true },
  italic: { prefix: '_', suffix: '_', trimFirst: true },
  // ... etc
}
```

## Phase 2: Core Operations (Text Manipulation)

### 2.1 Extract Block Style Handler
**Source:** `index.ts` lines 581-646

**Extract:**
- `blockStyle()` - Core formatting logic
- Toggle detection (format already applied)
- Smart cursor positioning
- Whitespace handling

**Refactor to:**
- Separate toggle detection into utility
- Create `applyFormat()` and `removeFormat()` helpers
- Simplify parameter structure

### 2.2 Extract List Handlers
**Source:** `index.ts` lines 676-784

**Extract:**
- `listStyle()` - List formatting logic
- `undoOrderedListStyle()` - Remove numbered lists
- `undoUnorderedListStyle()` - Remove bullet lists
- List type conversion logic

**Refactor to:**
- Separate bullet and numbered list logic
- Create shared list utilities
- Simplify the undo mechanism

### 2.3 Extract Multiline Handler
**Source:** `index.ts` lines 648-670

**Extract:**
- `multilineStyle()` - Quote and multiline formatting
- Line-by-line processing logic

**Adapt for:**
- Quote formatting
- Code block formatting
- Future multiline formats

## Phase 3: API Layer (Public Functions)

### 3.1 Create Primary Format Functions

**Pattern for each function:**
```javascript
export function toggleBold(textarea) {
  // 1. Get current selection
  // 2. Detect if format exists
  // 3. Apply or remove format
  // 4. Update selection
}
```

**Functions to create:**
- `toggleBold()` - Using blockStyle with bold config
- `toggleItalic()` - Using blockStyle with italic config
- `toggleStrikethrough()` - Using blockStyle with strikethrough config
- `toggleCode()` - Smart single/multi-line detection
- `insertLink()` - URL detection + link format
- `insertImage()` - Similar to link with image syntax
- `toggleBulletList()` - Using listStyle
- `toggleNumberedList()` - Using listStyle
- `toggleTaskList()` - Using multiline with task config
- `toggleQuote()` - Using multilineStyle
- `insertHeader()` - Level-based prefix application

### 3.2 Create Utility Functions

**Detection utilities:**
- `getActiveFormats()` - Scan for all active formats
- `hasFormat()` - Check specific format
- `expandSelection()` - Selection expansion options

**Custom format support:**
- `applyCustomFormat()` - Apply user-defined formats

## Phase 4: Optimization & Cleanup

### 4.1 Simplification Opportunities

**Remove:**
- All web component code
- DOM event handling
- Focus management
- Toolbar-specific logic
- TypeScript interfaces (initially, add back later)

**Simplify:**
- Combine similar operations
- Reduce parameter passing
- Eliminate WeakMap usage
- Remove method indirection

### 4.2 Size Optimization

**Strategies:**
- Share code between similar operations (bold/italic/strikethrough)
- Extract common patterns into helpers
- Use shorter variable names in production
- Tree-shaking friendly exports

**Target structure:**
```javascript
// Optimal for tree-shaking
export { toggleBold } from './formats/bold'
export { toggleItalic } from './formats/italic'
// etc...
```

### 4.3 Performance Optimization

**Improvements:**
- Cache selection state during operation
- Minimize textarea.value access
- Batch selection updates
- Optimize regex usage

## Phase 5: Module Structure

### 5.1 File Organization

```
src/
├── index.js           # Main exports
├── core/
│   ├── insertion.js   # insertText utility
│   ├── selection.js   # Selection utilities
│   └── detection.js   # Format detection
├── operations/
│   ├── block.js       # Block-level formatting
│   ├── inline.js      # Inline formatting
│   ├── list.js        # List operations
│   └── multiline.js   # Multiline operations
├── formats/
│   ├── bold.js        # toggleBold
│   ├── italic.js      # toggleItalic
│   ├── link.js        # insertLink
│   ├── lists.js       # List toggles
│   └── ...
└── utils/
    └── helpers.js     # Shared utilities
```

### 5.2 Export Strategy

```javascript
// Named exports for tree-shaking
export { toggleBold } from './formats/bold'
export { toggleItalic } from './formats/italic'

// Also provide namespace import
import * as markdownToolbar from './index'

// And a default object for convenience
export default {
  toggleBold,
  toggleItalic,
  // ...
}
```

## Phase 6: Testing & Validation

### 6.1 Test Coverage Requirements

**Each function needs tests for:**
- Empty textarea
- No selection (cursor only)
- With selection
- Toggle on/off behavior
- Multi-line scenarios (where applicable)
- Edge cases (start/end of text)
- Cursor position after operation

### 6.2 Compatibility Testing

**Validate against:**
- Original GitHub implementation behavior
- Our failed prototype (ensure we fix all issues)
- Real-world markdown parsers (CommonMark)

## Implementation Order

### Week 1: Foundation
1. Set up module structure
2. Extract core utilities (Phase 1)
3. Extract text insertion system
4. Create test harness

### Week 2: Core Operations  
1. Extract and refactor blockStyle (Phase 2.1)
2. Extract and refactor list handlers (Phase 2.2)
3. Create inline format functions (bold, italic, code)
4. Test inline formatting thoroughly

### Week 3: Complete Features
1. Implement link/image insertion
2. Implement list operations
3. Implement quote/multiline formats
4. Add utility functions

### Week 4: Polish
1. Optimization pass
2. Documentation
3. Build system setup
4. npm package preparation

## Success Metrics

### Functional Requirements
- [ ] All 15 primary functions working correctly
- [ ] Toggle behavior matches GitHub's implementation  
- [ ] Cursor positioning is accurate
- [ ] Undo/redo integration works

### Non-Functional Requirements
- [ ] Bundle size under 4kb gzipped
- [ ] Zero runtime dependencies
- [ ] Works in all modern browsers
- [ ] Tree-shakeable exports
- [ ] 100% test coverage

## Risk Mitigation

### Potential Issues & Solutions

**Issue:** execCommand deprecation warnings
**Solution:** Provide configuration to use manual mode

**Issue:** Complex list numbering logic
**Solution:** Start with simple "1." for all items, enhance later

**Issue:** Selection API differences across browsers
**Solution:** Add compatibility layer with feature detection

**Issue:** Multiline operations complexity
**Solution:** Start with simple line-by-line, optimize later

## Extraction Checklist

### From `index.ts`, extract:
- [ ] Lines 419-443: String utilities
- [ ] Lines 446-485: insertText function
- [ ] Lines 502-515: expandSelectionToLine
- [ ] Lines 517-537: expandSelectedText  
- [ ] Lines 544-573: newlinesToSurroundSelectedText
- [ ] Lines 581-646: blockStyle function
- [ ] Lines 648-670: multilineStyle function
- [ ] Lines 676-704: Undo list functions
- [ ] Lines 730-784: listStyle function
- [ ] Lines 86-118: Style definitions

### Transform into:
- [ ] 15 public API functions
- [ ] 5-7 utility functions
- [ ] 3-4 internal helpers
- [ ] Clean export structure

## Notes

- Start with working code, optimize later
- Maintain GitHub's proven logic patterns
- Test each extraction immediately
- Keep functions pure and stateless
- Document behavior, not implementation