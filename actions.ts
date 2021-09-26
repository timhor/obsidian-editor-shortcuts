import { Editor } from 'obsidian';
import { getLineStartPos, getLineEndPos } from 'utils';

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

export const deleteLine = (editor: Editor) => {
  const { line } = editor.getCursor();
  const startOfCurrentLine = getLineStartPos(line);
  const startOfNextLine = getLineStartPos(line + 1);
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
  const { line } = editor.getCursor('from');
  const startOfCurrentLine = getLineStartPos(line);

  // if a line is already selected, expand the selection to the next line
  const selections = editor.listSelections();
  const existingSelectedLine =
    selections.length > 0 ? selections[0].head.line : line;
  const nextUnselectedLine = existingSelectedLine + 1;
  const startOfNextUnselectedLine = getLineStartPos(nextUnselectedLine);

  editor.setSelection(startOfCurrentLine, startOfNextUnselectedLine);
};
