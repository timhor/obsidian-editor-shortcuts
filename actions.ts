import { Editor } from 'obsidian';
import { getLineStartPos, getLineEndPos, getSelectionBoundaries } from 'utils';

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
  const { line } = editor.getCursor();
  const contentsOfCurrentLine = editor.getLine(line);
  const startOfCurrentLine = getLineStartPos(line);
  editor.replaceRange(contentsOfCurrentLine + '\n', startOfCurrentLine);
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

export const transformCase = (editor: Editor, caseType: 'upper' | 'lower') => {
  const selectedText = editor.getSelection();
  editor.replaceSelection(
    caseType === 'upper'
      ? selectedText.toUpperCase()
      : selectedText.toLowerCase(),
  );
};
