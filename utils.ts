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

const isWordCharacter = (char: string) => /\w/.test(char);

export const wordRangeAtPos = (
  pos: EditorPosition,
  lineContent: string,
): { anchor: EditorPosition; head: EditorPosition } => {
  let start = pos.ch;
  let end = pos.ch;
  while (start > 0 && isWordCharacter(lineContent.charAt(start - 1))) {
    start--;
  }
  while (end < lineContent.length && isWordCharacter(lineContent.charAt(end))) {
    end++;
  }
  return {
    anchor: {
      line: pos.line,
      ch: start,
    },
    head: {
      line: pos.line,
      ch: end,
    },
  };
};
