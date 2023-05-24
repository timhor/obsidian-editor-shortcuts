import type {
  App,
  Editor,
  EditorChange,
  EditorPosition,
  EditorSelection,
} from 'obsidian';
import {
  CASE,
  SEARCH_DIRECTION,
  MATCHING_BRACKETS,
  MATCHING_QUOTES,
  MATCHING_QUOTES_BRACKETS,
  MatchingCharacterMap,
  CODE_EDITOR,
  LIST_CHARACTER_REGEX,
} from './constants';
import { SettingsState } from './state';
import {
  CheckCharacter,
  EditorActionCallbackNewArgs,
  findAllMatchPositions,
  findNextMatchPosition,
  findPosOfNextCharacter,
  formatRemainingListPrefixes,
  getLeadingWhitespace,
  getLineEndPos,
  getLineStartPos,
  getNextCase,
  toTitleCase,
  getSelectionBoundaries,
  wordRangeAtPos,
  getSearchText,
  getNextListPrefix,
  isNumeric,
} from './utils';

export const insertLineAbove = (
  editor: Editor,
  selection: EditorSelection,
  args: EditorActionCallbackNewArgs,
) => {
  const { line } = selection.head;
  const startOfCurrentLine = getLineStartPos(line);

  const contentsOfCurrentLine = editor.getLine(line);
  const indentation = getLeadingWhitespace(contentsOfCurrentLine);

  let listPrefix = '';
  if (
    SettingsState.autoInsertListPrefix &&
    line > 0 &&
    // If inside a list, only insert prefix if within the same list
    editor.getLine(line - 1).trim().length > 0
  ) {
    listPrefix = getNextListPrefix(contentsOfCurrentLine, 'before');
    if (isNumeric(listPrefix)) {
      formatRemainingListPrefixes(editor, line, indentation);
    }
  }

  const changes: EditorChange[] = [
    { from: startOfCurrentLine, text: indentation + listPrefix + '\n' },
  ];
  const newSelection = {
    from: {
      ...startOfCurrentLine,
      // Offset by iteration
      line: startOfCurrentLine.line + args.iteration,
      ch: indentation.length + listPrefix.length,
    },
  };
  return {
    changes,
    newSelection,
  };
};

export const insertLineBelow = (
  editor: Editor,
  selection: EditorSelection,
  args: EditorActionCallbackNewArgs,
) => {
  const { line } = selection.head;
  const startOfCurrentLine = getLineStartPos(line);
  const endOfCurrentLine = getLineEndPos(line, editor);

  const contentsOfCurrentLine = editor.getLine(line);
  const indentation = getLeadingWhitespace(contentsOfCurrentLine);

  let listPrefix = '';
  if (SettingsState.autoInsertListPrefix) {
    listPrefix = getNextListPrefix(contentsOfCurrentLine, 'after');

    // Performing this action on an empty list item should delete it
    if (listPrefix === null) {
      const changes: EditorChange[] = [
        { from: startOfCurrentLine, to: endOfCurrentLine, text: '' },
      ];
      const newSelection = {
        from: {
          line,
          ch: 0,
        },
      };
      return {
        changes,
        newSelection,
      };
    }

    if (isNumeric(listPrefix)) {
      formatRemainingListPrefixes(editor, line + 1, indentation);
    }
  }

  const changes: EditorChange[] = [
    { from: endOfCurrentLine, text: '\n' + indentation + listPrefix },
  ];
  const newSelection = {
    from: {
      // Offset by iteration
      line: line + 1 + args.iteration,
      ch: indentation.length + listPrefix.length,
    },
  };
  return {
    changes,
    newSelection,
  };
};

// Note: don't use the built-in exec method for 'deleteLine' as there is a bug
// where running it on a line that is long enough to be wrapped will focus on
// the previous line instead of the next line after deletion
let numLinesDeleted = 0;
export const deleteLine = (
  editor: Editor,
  selection: EditorSelection,
  args: EditorActionCallbackNewArgs,
) => {
  const { from, to, hasTrailingNewline } = getSelectionBoundaries(selection);

  if (to.line === editor.lastLine()) {
    // There is no 'next line' when cursor is on the last line
    const previousLine = Math.max(0, from.line - 1);
    const endOfPreviousLine = getLineEndPos(previousLine, editor);
    const changes: EditorChange[] = [
      {
        from: from.line === 0 ? getLineStartPos(0) : endOfPreviousLine,
        to:
          // Exclude line starting at trailing newline at end of document from being deleted
          to.ch === 0
            ? getLineStartPos(to.line)
            : getLineEndPos(to.line, editor),
        text: '',
      },
    ];
    const newSelection = {
      from: {
        line: previousLine,
        ch: Math.min(from.ch, endOfPreviousLine.ch),
      },
    };
    return {
      changes,
      newSelection,
    };
  }

  // Reset offset at the start of a new bulk delete operation
  if (args.iteration === 0) {
    numLinesDeleted = 0;
  }
  // Exclude line starting at trailing newline from being deleted
  const toLine = hasTrailingNewline ? to.line - 1 : to.line;
  const endOfNextLine = getLineEndPos(toLine + 1, editor);
  const changes: EditorChange[] = [
    {
      from: getLineStartPos(from.line),
      to: getLineStartPos(toLine + 1),
      text: '',
    },
  ];
  const newSelection = {
    from: {
      // Offset by the number of lines deleted in all previous iterations
      line: from.line - numLinesDeleted,
      ch: Math.min(to.ch, endOfNextLine.ch),
    },
  };
  // This needs to be calculated after setting the new selection as it only
  // applies for subsequent iterations
  numLinesDeleted += toLine - from.line + 1;
  return {
    changes,
    newSelection,
  };
};

export const deleteToStartOfLine = (
  editor: Editor,
  selection: EditorSelection,
) => {
  const pos = selection.head;
  let startPos = getLineStartPos(pos.line);

  if (pos.line === 0 && pos.ch === 0) {
    // We're at the start of the document so do nothing
    return selection;
  }

  if (pos.line === startPos.line && pos.ch === startPos.ch) {
    // We're at the start of the line so delete the preceding newline
    startPos = getLineEndPos(pos.line - 1, editor);
  }

  editor.replaceRange('', startPos, pos);
  return {
    anchor: startPos,
  };
};

export const deleteToEndOfLine = (
  editor: Editor,
  selection: EditorSelection,
) => {
  const pos = selection.head;
  let endPos = getLineEndPos(pos.line, editor);

  if (pos.line === endPos.line && pos.ch === endPos.ch) {
    // We're at the end of the line so delete just the newline
    endPos = getLineStartPos(pos.line + 1);
  }

  editor.replaceRange('', pos, endPos);
  return {
    anchor: pos,
  };
};

export const joinLines = (editor: Editor, selection: EditorSelection) => {
  const { from, to } = getSelectionBoundaries(selection);
  const { line } = from;

  let endOfCurrentLine = getLineEndPos(line, editor);
  const joinRangeLimit = Math.max(to.line - line, 1);
  const selectionLength = editor.posToOffset(to) - editor.posToOffset(from);
  let trimmedChars = '';

  for (let i = 0; i < joinRangeLimit; i++) {
    if (line === editor.lineCount() - 1) {
      break;
    }
    endOfCurrentLine = getLineEndPos(line, editor);
    const endOfNextLine = getLineEndPos(line + 1, editor);
    const contentsOfCurrentLine = editor.getLine(line);
    const contentsOfNextLine = editor.getLine(line + 1);

    const charsToTrim = contentsOfNextLine.match(LIST_CHARACTER_REGEX) ?? [];
    trimmedChars += charsToTrim[0] ?? '';

    const newContentsOfNextLine = contentsOfNextLine.replace(
      LIST_CHARACTER_REGEX,
      '',
    );
    if (
      newContentsOfNextLine.length > 0 &&
      contentsOfCurrentLine.charAt(endOfCurrentLine.ch - 1) !== ' '
    ) {
      editor.replaceRange(
        ' ' + newContentsOfNextLine,
        endOfCurrentLine,
        endOfNextLine,
      );
    } else {
      editor.replaceRange(
        newContentsOfNextLine,
        endOfCurrentLine,
        endOfNextLine,
      );
    }
  }

  if (selectionLength === 0) {
    return {
      anchor: endOfCurrentLine,
    };
  }
  return {
    anchor: from,
    head: {
      line: from.line,
      ch: from.ch + selectionLength - trimmedChars.length,
    },
  };
};

export const copyLine = (
  editor: Editor,
  selection: EditorSelection,
  direction: 'up' | 'down',
) => {
  const { from, to, hasTrailingNewline } = getSelectionBoundaries(selection);
  const fromLineStart = getLineStartPos(from.line);
  // Exclude line starting at trailing newline from being duplicated
  const toLine = hasTrailingNewline ? to.line - 1 : to.line;
  const toLineEnd = getLineEndPos(toLine, editor);
  const contentsOfSelectedLines = editor.getRange(fromLineStart, toLineEnd);
  if (direction === 'up') {
    editor.replaceRange('\n' + contentsOfSelectedLines, toLineEnd);
    return selection;
  } else {
    editor.replaceRange(contentsOfSelectedLines + '\n', fromLineStart);
    // This uses `to.line` instead of `toLine` to avoid a double adjustment
    const linesSelected = to.line - from.line + 1;
    return {
      anchor: { line: toLine + 1, ch: from.ch },
      head: { line: toLine + linesSelected, ch: to.ch },
    };
  }
};

/*
Properties used to distinguish between selections that are programmatic
(expanding from a cursor selection) vs. manual (using a mouse / Shift + arrow
keys). This controls the match behaviour for selectWordOrNextOccurrence.
*/
let isManualSelection = true;
export const setIsManualSelection = (value: boolean) => {
  isManualSelection = value;
};
export let isProgrammaticSelectionChange = false;
export const setIsProgrammaticSelectionChange = (value: boolean) => {
  isProgrammaticSelectionChange = value;
};

export const selectWordOrNextOccurrence = (editor: Editor) => {
  setIsProgrammaticSelectionChange(true);
  const allSelections = editor.listSelections();
  const { searchText, singleSearchText } = getSearchText({
    editor,
    allSelections,
    autoExpand: false,
  });

  if (searchText.length > 0 && singleSearchText) {
    const { from: latestMatchPos } = getSelectionBoundaries(
      allSelections[allSelections.length - 1],
    );
    const nextMatch = findNextMatchPosition({
      editor,
      latestMatchPos,
      searchText,
      searchWithinWords: isManualSelection,
      documentContent: editor.getValue(),
    });
    const newSelections = nextMatch
      ? allSelections.concat(nextMatch)
      : allSelections;
    editor.setSelections(newSelections);
    const lastSelection = newSelections[newSelections.length - 1];
    editor.scrollIntoView(getSelectionBoundaries(lastSelection));
  } else {
    const newSelections = [];
    for (const selection of allSelections) {
      const { from, to } = getSelectionBoundaries(selection);
      // Don't modify existing range selections
      if (from.line !== to.line || from.ch !== to.ch) {
        newSelections.push(selection);
      } else {
        newSelections.push(wordRangeAtPos(from, editor.getLine(from.line)));
        setIsManualSelection(false);
      }
    }
    editor.setSelections(newSelections);
  }
};

export const selectAllOccurrences = (editor: Editor) => {
  const allSelections = editor.listSelections();
  const { searchText, singleSearchText } = getSearchText({
    editor,
    allSelections,
    autoExpand: true,
  });
  if (!singleSearchText) {
    return;
  }
  const matches = findAllMatchPositions({
    editor,
    searchText,
    searchWithinWords: true,
    documentContent: editor.getValue(),
  });
  editor.setSelections(matches);
};

export const selectLine = (_editor: Editor, selection: EditorSelection) => {
  const { from, to } = getSelectionBoundaries(selection);
  const startOfCurrentLine = getLineStartPos(from.line);
  // if a line is already selected, expand the selection to the next line
  const startOfNextLine = getLineStartPos(to.line + 1);
  return { anchor: startOfCurrentLine, head: startOfNextLine };
};

export const addCursorsToSelectionEnds = (
  editor: Editor,
  emulate: CODE_EDITOR = CODE_EDITOR.VSCODE,
) => {
  // Only apply the action if there is exactly one selection
  if (editor.listSelections().length !== 1) {
    return;
  }
  const selection = editor.listSelections()[0];
  const { from, to, hasTrailingNewline } = getSelectionBoundaries(selection);
  const newSelections = [];
  // Exclude line starting at trailing newline from having cursor added
  const toLine = hasTrailingNewline ? to.line - 1 : to.line;
  for (let line = from.line; line <= toLine; line++) {
    const head = line === to.line ? to : getLineEndPos(line, editor);
    let anchor: EditorPosition;
    if (emulate === CODE_EDITOR.VSCODE) {
      anchor = head;
    } else {
      anchor = line === from.line ? from : getLineStartPos(line);
    }
    newSelections.push({
      anchor,
      head,
    });
  }
  editor.setSelections(newSelections);
};

export const goToLineBoundary = (
  editor: Editor,
  selection: EditorSelection,
  boundary: 'start' | 'end',
) => {
  const { from, to } = getSelectionBoundaries(selection);
  if (boundary === 'start') {
    return { anchor: getLineStartPos(from.line) };
  } else {
    return { anchor: getLineEndPos(to.line, editor) };
  }
};

export const navigateLine = (
  editor: Editor,
  selection: EditorSelection,
  position: 'next' | 'prev' | 'first' | 'last',
) => {
  const pos = selection.head;
  let line: number;
  let ch: number;

  if (position === 'prev') {
    line = Math.max(pos.line - 1, 0);
    const endOfLine = getLineEndPos(line, editor);
    ch = Math.min(pos.ch, endOfLine.ch);
  }
  if (position === 'next') {
    line = Math.min(pos.line + 1, editor.lineCount() - 1);
    const endOfLine = getLineEndPos(line, editor);
    ch = Math.min(pos.ch, endOfLine.ch);
  }
  if (position === 'first') {
    line = 0;
    ch = 0;
  }
  if (position === 'last') {
    line = editor.lineCount() - 1;
    const endOfLine = getLineEndPos(line, editor);
    ch = endOfLine.ch;
  }

  return { anchor: { line, ch } };
};

export const moveCursor = (
  editor: Editor,
  direction: 'up' | 'down' | 'left' | 'right',
) => {
  switch (direction) {
    case 'up':
      editor.exec('goUp');
      break;
    case 'down':
      editor.exec('goDown');
      break;
    case 'left':
      editor.exec('goLeft');
      break;
    case 'right':
      editor.exec('goRight');
      break;
  }
};

export const moveWord = (editor: Editor, direction: 'left' | 'right') => {
  switch (direction) {
    case 'left':
      // @ts-expect-error - command not defined in Obsidian API
      editor.exec('goWordLeft');
      break;
    case 'right':
      // @ts-expect-error - command not defined in Obsidian API
      editor.exec('goWordRight');
      break;
  }
};

export const transformCase = (
  editor: Editor,
  selection: EditorSelection,
  caseType: CASE,
) => {
  let { from, to } = getSelectionBoundaries(selection);
  let selectedText = editor.getRange(from, to);

  // apply transform on word at cursor if nothing is selected
  if (selectedText.length === 0) {
    const pos = selection.head;
    const { anchor, head } = wordRangeAtPos(pos, editor.getLine(pos.line));
    [from, to] = [anchor, head];
    selectedText = editor.getRange(anchor, head);
  }

  let replacementText = selectedText;

  switch (caseType) {
    case CASE.UPPER: {
      replacementText = selectedText.toUpperCase();
      break;
    }
    case CASE.LOWER: {
      replacementText = selectedText.toLowerCase();
      break;
    }
    case CASE.TITLE: {
      replacementText = toTitleCase(selectedText);
      break;
    }
    case CASE.NEXT: {
      replacementText = getNextCase(selectedText);
      break;
    }
  }

  editor.replaceRange(replacementText, from, to);

  return selection;
};

const expandSelection = ({
  editor,
  selection,
  openingCharacterCheck,
  matchingCharacterMap,
}: {
  editor: Editor;
  selection: EditorSelection;
  openingCharacterCheck: CheckCharacter;
  matchingCharacterMap: MatchingCharacterMap;
}) => {
  let { anchor, head } = selection;

  // in case user selects upwards
  if (anchor.line >= head.line && anchor.ch > anchor.ch) {
    [anchor, head] = [head, anchor];
  }

  const newAnchor = findPosOfNextCharacter({
    editor,
    startPos: anchor,
    checkCharacter: openingCharacterCheck,
    searchDirection: SEARCH_DIRECTION.BACKWARD,
  });
  if (!newAnchor) {
    return selection;
  }

  const newHead = findPosOfNextCharacter({
    editor,
    startPos: head,
    checkCharacter: (char: string) =>
      char === matchingCharacterMap[newAnchor.match],
    searchDirection: SEARCH_DIRECTION.FORWARD,
  });
  if (!newHead) {
    return selection;
  }

  return { anchor: newAnchor.pos, head: newHead.pos };
};

export const expandSelectionToBrackets = (
  editor: Editor,
  selection: EditorSelection,
) =>
  expandSelection({
    editor,
    selection,
    openingCharacterCheck: (char: string) => /[([{]/.test(char),
    matchingCharacterMap: MATCHING_BRACKETS,
  });

export const expandSelectionToQuotes = (
  editor: Editor,
  selection: EditorSelection,
) =>
  expandSelection({
    editor,
    selection,
    openingCharacterCheck: (char: string) => /['"`]/.test(char),
    matchingCharacterMap: MATCHING_QUOTES,
  });

export const expandSelectionToQuotesOrBrackets = (editor: Editor) => {
  const selections = editor.listSelections();
  const newSelection = expandSelection({
    editor,
    selection: selections[0],
    openingCharacterCheck: (char: string) => /['"`([{]/.test(char),
    matchingCharacterMap: MATCHING_QUOTES_BRACKETS,
  });
  editor.setSelections([...selections, newSelection]);
};

const insertCursor = (editor: Editor, lineOffset: number) => {
  const selections = editor.listSelections();
  const newSelections = [];
  for (const selection of selections) {
    const { line, ch } = selection.head;
    if (
      (line === 0 && lineOffset < 0) ||
      (line === editor.lastLine() && lineOffset > 0)
    ) {
      break;
    }
    const targetLineLength = editor.getLine(line + lineOffset).length;
    newSelections.push({
      anchor: {
        line: selection.anchor.line + lineOffset,
        ch: Math.min(selection.anchor.ch, targetLineLength),
      },
      head: {
        line: line + lineOffset,
        ch: Math.min(ch, targetLineLength),
      },
    });
  }
  editor.setSelections([...editor.listSelections(), ...newSelections]);
};

export const insertCursorAbove = (editor: Editor) => insertCursor(editor, -1);

export const insertCursorBelow = (editor: Editor) => insertCursor(editor, 1);

export const goToHeading = (
  app: App,
  editor: Editor,
  boundary: 'prev' | 'next',
) => {
  const file = app.metadataCache.getFileCache(app.workspace.getActiveFile());
  if (!file.headings || file.headings.length === 0) {
    return;
  }

  const { line } = editor.getCursor('from');
  let prevHeadingLine = 0;
  let nextHeadingLine = editor.lastLine();

  file.headings.forEach(({ position }) => {
    const { end: headingPos } = position;
    if (line > headingPos.line && headingPos.line > prevHeadingLine) {
      prevHeadingLine = headingPos.line;
    }
    if (line < headingPos.line && headingPos.line < nextHeadingLine) {
      nextHeadingLine = headingPos.line;
    }
  });

  editor.setSelection(
    boundary === 'prev'
      ? getLineEndPos(prevHeadingLine, editor)
      : getLineEndPos(nextHeadingLine, editor),
  );
};
