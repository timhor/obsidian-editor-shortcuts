import { Editor, EditorPosition } from 'obsidian';

export const insertLineAbove = (editor: Editor) => {
  const { line } = editor.getCursor();
  const startOfCurrentLine: EditorPosition = {
    line,
    ch: 0,
  };
  editor.replaceRange('\n', startOfCurrentLine);
  editor.setSelection(startOfCurrentLine);
};

export const insertLineBelow = (editor: Editor) => {
  const { line } = editor.getCursor();
  const endOfCurrentLine: EditorPosition = {
    line,
    ch: editor.getLine(line).length,
  };
  editor.replaceRange('\n', endOfCurrentLine);
  editor.setSelection({ line: line + 1, ch: 0 });
};

export const deleteLine = (editor: Editor) => {
  const { line } = editor.getCursor();
  const startOfCurrentLine: EditorPosition = {
    line,
    ch: 0,
  };
  const startOfNextLine: EditorPosition = {
    line: line + 1,
    ch: 0,
  };
  editor.replaceRange('', startOfCurrentLine, startOfNextLine);
};

export const joinLines = (editor: Editor) => {
  const { line } = editor.getCursor();
  const contentsOfNextLine = editor.getLine(line + 1);
  const endOfCurrentLine: EditorPosition = {
    line,
    ch: editor.getLine(line).length,
  };
  const endOfNextLine: EditorPosition = {
    line: line + 1,
    ch: editor.getLine(line + 1).length,
  };
  editor.replaceRange(
    ' ' + contentsOfNextLine,
    endOfCurrentLine,
    endOfNextLine,
  );
  editor.setSelection(endOfCurrentLine);
};
