import { Editor } from 'obsidian';
import {
  getLineStartPos,
  getLineEndPos,
  getSelectionBoundaries,
  wordRangeAtPos,
  getLeadingWhitespace,
  findPosOfNextCharacter,
  CheckCharacter,
} from './utils';
import {
  CASE,
  DIRECTION,
  LOWERCASE_ARTICLES,
  MatchingCharacterMap,
  MATCHING_BRACKETS,
  MATCHING_QUOTES,
} from './constants';

export const insertLineAbove = (editor: Editor) => {
  const { line } = editor.getCursor();
  const startOfCurrentLine = getLineStartPos(line);
  editor.replaceRange('\n', startOfCurrentLine);
  editor.setSelection(startOfCurrentLine);
};

export const insertLineBelow = (editor: Editor) => {
  const { line } = editor.getCursor();
  const endOfCurrentLine = getLineEndPos(line, editor);
  const indentation = getLeadingWhitespace(editor.getLine(line));
  editor.replaceRange('\n' + indentation, endOfCurrentLine);
  editor.setSelection({ line: line + 1, ch: indentation.length });
};

export const deleteSelectedLines = (editor: Editor) => {
  const selections = editor.listSelections();
  if (selections.length === 0) {
    return;
  }
  const { from, to } = getSelectionBoundaries(selections[0]);
  if (to.line === editor.lastLine()) {
    // there is no 'next line' when cursor is on the last line
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
};

export const joinLines = (editor: Editor) => {
  const { line } = editor.getCursor();
  const contentsOfNextLine = editor.getLine(line + 1).trimStart();
  const endOfCurrentLine = getLineEndPos(line, editor);
  const endOfNextLine = getLineEndPos(line + 1, editor);
  editor.replaceRange(
    contentsOfNextLine.length > 0
      ? ' ' + contentsOfNextLine
      : contentsOfNextLine,
    endOfCurrentLine,
    endOfNextLine,
  );
  editor.setSelection(endOfCurrentLine);
};

export const duplicateLine = (editor: Editor) => {
  const selections = editor.listSelections();
  if (selections.length === 0) {
    return;
  }
  const { from, to } = getSelectionBoundaries(selections[0]);
  const fromLineStart = getLineStartPos(from.line);
  const toLineEnd = getLineEndPos(to.line, editor);
  const contentsOfSelectedLines = editor.getRange(fromLineStart, toLineEnd);
  editor.replaceRange(contentsOfSelectedLines + '\n', fromLineStart);
};

export const selectLine = (editor: Editor) => {
  const selections = editor.listSelections();
  if (selections.length === 0) {
    return;
  }
  const { from, to } = getSelectionBoundaries(selections[0]);
  const startOfCurrentLine = getLineStartPos(from.line);
  // if a line is already selected, expand the selection to the next line
  const startOfNextLine = getLineStartPos(to.line + 1);
  editor.setSelection(startOfCurrentLine, startOfNextLine);
};

export const goToLineBoundary = (editor: Editor, boundary: 'start' | 'end') => {
  const { line } = editor.getCursor('from');
  editor.setSelection(
    boundary === 'start' ? getLineStartPos(line) : getLineEndPos(line, editor),
  );
};

export const transformCase = (editor: Editor, caseType: CASE) => {
  const originalSelections = editor.listSelections();
  let selectedText = editor.getSelection();

  // apply transform on word at cursor if nothing is selected
  if (selectedText.length === 0) {
    const pos = editor.getCursor('from');
    const { anchor, head } = wordRangeAtPos(pos, editor.getLine(pos.line));
    editor.setSelection(anchor, head);
    selectedText = editor.getRange(anchor, head);
  }

  if (caseType === CASE.TITLE) {
    editor.replaceSelection(
      // use capture group to join with the same separator used to split
      selectedText
        .split(/(\s+)/)
        .map((word, index, allWords) => {
          if (
            index > 0 &&
            index < allWords.length - 1 &&
            LOWERCASE_ARTICLES.includes(word)
          ) {
            return word;
          }
          return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
        })
        .join(''),
    );
  } else {
    editor.replaceSelection(
      caseType === CASE.UPPER
        ? selectedText.toUpperCase()
        : selectedText.toLowerCase(),
    );
  }

  // restore original selection after replacing content
  if (originalSelections.length > 0) {
    const { anchor, head } = originalSelections[0];
    editor.setSelection(anchor, head);
  }
};

export const expandSelection = ({
  editor,
  openingCharacterCheck,
  matchingCharacterMap,
}: {
  editor: Editor;
  openingCharacterCheck: CheckCharacter;
  matchingCharacterMap: MatchingCharacterMap;
}) => {
  let anchor = editor.getCursor('anchor');
  let head = editor.getCursor('head');

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
    return;
  }

  const newHead = findPosOfNextCharacter({
    editor,
    startPos: head,
    checkCharacter: (char: string) =>
      char === matchingCharacterMap[newAnchor.match],
    searchDirection: DIRECTION.FORWARD,
  });
  if (!newHead) {
    return;
  }

  editor.setSelection(newAnchor.pos, newHead.pos);
};

export const expandSelectionToBrackets = (editor: Editor) =>
  expandSelection({
    editor,
    openingCharacterCheck: (char: string) => /[\(\[\{]/.test(char),
    matchingCharacterMap: MATCHING_BRACKETS,
  });

export const expandSelectionToQuotes = (editor: Editor) =>
  expandSelection({
    editor,
    openingCharacterCheck: (char: string) => /['"`]/.test(char),
    matchingCharacterMap: MATCHING_QUOTES,
  });
