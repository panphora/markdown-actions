# Changelog

## [Unreleased]

### Added
- `toggleStrikethrough` strikes text through with `~~`, and removes `~~text~~` or `~text~`.
- `toggleH4`, `toggleH5` and `toggleH6` toggle the deeper heading levels.
- `getActiveFormats` reports `strikethrough`, `header-4`, `header-5` and `header-6`.

### Fixed
- Bold and italic toggle off on text that is also struck through, whichever marker is on the outside.
- A second click on Bold or Italic with nothing selected removes the empty pair of markers the first click wrote, instead of adding more.

## [1.2.0] - 2026-10-29

### Added
- You can turn text into a blockquote or a task list.
- Headings can be toggled on and off.
- Formatting supports alternate Markdown markers and follows the marker style the document already uses.

### Changed
- Formatting actions toggle on and off, so you can remove formatting the same way you apply it.
- The current selection is kept after a formatting action.

### Fixed
- Undo and redo work after bold or italic formatting, including when text is selected.
