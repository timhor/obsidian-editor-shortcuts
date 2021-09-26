import { Editor, EditorPosition, EditorSelection } from 'obsidian';

export const getLineStartPos = (line: number): EditorPosition => ({
  line,
  ch: 0,
});

export const getLineEndPos = (
  line: number,
  editor: Editor,
): EditorPosition => ({
  line,
  ch: editor.getLine(line).length,
});

export const getSelectionBoundaries = (selection: EditorSelection) => {
  let { anchor: from, head: to } = selection;

  // in case user selects upwards
  if (from.line > to.line) {
    [from, to] = [to, from];
  }

  return { from, to };
};
