# Changelog

## Unreleased

### CodeMirror 6 migration

All commands now dispatch their edits as a single transaction through
Obsidian's `Editor.transaction` instead of issuing sequential
`replaceRange` calls per cursor. Intentional behavior changes, each pinned
by a regression test:

- **Undo granularity (fix):** a multi-cursor command is now always a single
  undo step. Previously, under Obsidian 1.x (CM6), the legacy `cm.operation`
  batching silently degraded and each cursor's edit became its own undo
  step.
- **Toggle case with multiple cursors in one word:** the transform now
  applies exactly once (identical overlapping changes are merged). The
  legacy sequential behavior made a second cursor in the same word re-toggle
  and undo the first cursor's change.
- **Delete to end of line with multiple cursors on one line:** the
  deletions are merged into the union of their ranges and every cursor on
  the line lands at the union's start. (Same final document as the legacy
  CM5 behavior, without relying on cursor remapping/collapsing mid-command.)
- **Delete to start of line with multiple cursors on one line:** likewise
  merged into a single deletion from the line start.
- **Select line with adjacent multi-cursor selections:** CM5 merged
  touching (not just overlapping) selections, so selecting adjacent lines
  with multiple cursors used to collapse into one combined selection. CM6
  only merges overlapping ranges; adjacent line selections stay separate.
  (This has been the actual behavior in Obsidian 1.x already; the test
  suite now pins it.)
- **Selection-only commands** (select line, go to line start/end, navigate
  line, expand selection to brackets/quotes) no longer dispatch an editor
  transaction at all, so they cannot pollute undo history.
- **Case transforms and cursor position:** selections/carets are restored
  at their original coordinates. For the rare non-length-preserving
  transforms (e.g. `ß` → `SS`), the cursor accounting matches the legacy
  behavior (positions are not adjusted for the length change).
