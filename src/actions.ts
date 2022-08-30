import type { App, Editor, EditorPosition, EditorSelection } from 'obsidian';
import {
  CASE,
  DIRECTION,
  LOWERCASE_ARTICLES,
  MATCHING_BRACKETS,
  MATCHING_QUOTES,
  MATCHING_QUOTES_BRACKETS,
  MatchingCharacterMap,
  CODE_EDITOR,
  JOIN_LINE_TRIM_REGEX,
} from './constants';
import {
  CheckCharacter,
  findAllMatchPositions,
  findNextMatchPosition,
  findPosOfNextCharacter,
  getLeadingWhitespace,
  getLineEndPos,
  getLineStartPos,
  getSearchText,
  getSelectionBoundaries,
  wordRangeAtPos,
} from './utils';

export const insertLineAbove = (editor: Editor, selection: EditorSelection) => {
  const { line } = selection.head;
  const startOfCurrentLine = getLineStartPos(line);
  editor.replaceRange('\n', startOfCurrentLine);
  return { anchor: startOfCurrentLine };
};

export const insertLineBelow = (editor: Editor, selection: EditorSelection) => {
  const { line } = selection.head;
  const endOfCurrentLine = getLineEndPos(line, editor);
  const indentation = getLeadingWhitespace(editor.getLine(line));
  editor.replaceRange('\n' + indentation, endOfCurrentLine);
  return { anchor: { line: line + 1, ch: indentation.length } };
};

export const deleteSelectedLines = (
  editor: Editor,
  selection: EditorSelection,
) => {
  const { from, to } = getSelectionBoundaries(selection);
  if (to.line === editor.lastLine()) {
    // There is no 'next line' when cursor is on the last line
    editor.replaceRange(
      '',
      getLineEndPos(from.line - 1, editor),
      getLineEndPos(to.line, editor),
    );
  } else {
    editor.replaceRange(
      '',
      getLineStartPos(from.line),
      getLineStartPos(to.line + 1),
    );
  }
  return { anchor: { line: from.line, ch: selection.head.ch } };
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
    const contentsOfNextLine = editor.getLine(line + 1);

    const charsToTrim = contentsOfNextLine.match(JOIN_LINE_TRIM_REGEX) ?? [];
    trimmedChars += charsToTrim[0] ?? '';

    const newContentsOfNextLine = contentsOfNextLine.replace(
      JOIN_LINE_TRIM_REGEX,
      '',
    );
    editor.replaceRange(
      newContentsOfNextLine.length > 0
        ? ' ' + newContentsOfNextLine
        : newContentsOfNextLine,
      endOfCurrentLine,
      endOfNextLine,
    );
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
  const { from, to } = getSelectionBoundaries(selection);
  const fromLineStart = getLineStartPos(from.line);
  const toLineEnd = getLineEndPos(to.line, editor);
  const contentsOfSelectedLines = editor.getRange(fromLineStart, toLineEnd);
  if (direction === 'up') {
    editor.replaceRange('\n' + contentsOfSelectedLines, toLineEnd);
    return selection;
  } else {
    editor.replaceRange(contentsOfSelectedLines + '\n', fromLineStart);
    const linesSelected = to.line - from.line + 1;
    return {
      anchor: { line: to.line + 1, ch: from.ch },
      head: { line: to.line + linesSelected, ch: to.ch },
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
  const { from, to } = getSelectionBoundaries(selection);
  const newSelections = [];
  for (let line = from.line; line <= to.line; line++) {
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
  direction: 'up' | 'down',
) => {
  const pos = selection.head;
  let line: number;

  if (direction === 'up') {
    line = Math.max(pos.line - 1, 0);
  } else {
    line = Math.min(pos.line + 1, editor.lineCount() - 1);
  }

  const endOfLine = getLineEndPos(line, editor);
  const ch = Math.min(pos.ch, endOfLine.ch);

  return { anchor: { line, ch } };
};

export const moveCursor = (
  editor: Editor,
  selection: EditorSelection,
  direction: DIRECTION,
) => {
  const { line, ch } = selection.head;

  const movement = direction === DIRECTION.BACKWARD ? -1 : 1;
  const lineLength = editor.getLine(line).length;
  const newPos = { line, ch: ch + movement };

  if (newPos.ch < 0 && newPos.line === 0) {
    // Moving backward past start of doc, do nothing
    newPos.ch = ch;
  } else if (newPos.ch < 0) {
    // Wrap backward over start of line
    newPos.line = Math.max(newPos.line - 1, 0);
    newPos.ch = editor.getLine(newPos.line).length;
  } else if (newPos.ch > lineLength) {
    // Wrap forward over end of line
    newPos.line += 1;
    newPos.ch = 0;
  }

  return { anchor: newPos };
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

  if (caseType === CASE.TITLE) {
    editor.replaceRange(
      // use capture group to join with the same separator used to split
      selectedText
        .split(/(\s+)/)
        .map((word, index, allWords) => {
          if (
            index > 0 &&
            index < allWords.length - 1 &&
            LOWERCASE_ARTICLES.includes(word.toLowerCase())
          ) {
            return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
        })
        .join(''),
      from,
      to,
    );
  } else {
    editor.replaceRange(
      caseType === CASE.UPPER
        ? selectedText.toUpperCase()
        : selectedText.toLowerCase(),
      from,
      to,
    );
  }

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
    searchDirection: DIRECTION.BACKWARD,
  });
  if (!newAnchor) {
    return selection;
  }

  const newHead = findPosOfNextCharacter({
    editor,
    startPos: head,
    checkCharacter: (char: string) =>
      char === matchingCharacterMap[newAnchor.match],
    searchDirection: DIRECTION.FORWARD,
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
