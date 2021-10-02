import { Editor } from 'obsidian';
import {
  getLineStartPos,
  getLineEndPos,
  getSelectionBoundaries,
} from './utils';
import { CASE, LOWERCASE_ARTICLES } from './constants';

export const insertLineAbove = (editor: Editor) => {
  const { line } = editor.getCursor();
  const startOfCurrentLine = getLineStartPos(line);
  editor.replaceRange('\n', startOfCurrentLine);
  editor.setSelection(startOfCurrentLine);
};

export const insertLineBelow = (editor: Editor) => {
  const { line } = editor.getCursor();
  const endOfCurrentLine = getLineEndPos(line, editor);
  editor.replaceRange('\n', endOfCurrentLine);
  editor.setSelection({ line: line + 1, ch: 0 });
};

export const deleteSelectedLines = (editor: Editor) => {
  const selections = editor.listSelections();
  if (selections.length === 0) {
    return;
  }
  const { from, to } = getSelectionBoundaries(selections[0]);
  const startOfCurrentLine = getLineStartPos(from.line);
  const startOfNextLine = getLineStartPos(to.line + 1);
  editor.replaceRange('', startOfCurrentLine, startOfNextLine);
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
  const selectedText = editor.getSelection();

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
    return;
  }

  editor.replaceSelection(
    caseType === CASE.UPPER
      ? selectedText.toUpperCase()
      : selectedText.toLowerCase(),
  );
};
