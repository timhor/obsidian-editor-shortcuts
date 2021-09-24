import { Editor, EditorPosition } from 'obsidian';

export const insertLineBelow = (editor: Editor) => {
  const { line } = editor.getCursor();
  const endOfCurrentLine: EditorPosition = {
    line,
    ch: editor.getLine(line).length,
  };
  editor.replaceRange('\n', endOfCurrentLine);
  editor.setSelection({ line: line + 1, ch: 0 });
};
