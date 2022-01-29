import { Editor, EditorPosition, EditorSelection } from 'obsidian';
import { DIRECTION } from './constants';

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

export const getLeadingWhitespace = (lineContent: string) => {
  const indentation = lineContent.match(/^\s+/);
  return indentation ? indentation[0] : '';
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

export type CheckCharacter = (char: string) => boolean;

export const findPosOfNextCharacter = ({
  editor,
  startPos,
  checkCharacter,
  searchDirection,
}: {
  editor: Editor;
  startPos: EditorPosition;
  checkCharacter: CheckCharacter;
  searchDirection: DIRECTION;
}) => {
  let { line, ch } = startPos;
  let lineContent = editor.getLine(line);
  let matchFound = false;
  let matchedChar: string;

  if (searchDirection === DIRECTION.BACKWARD) {
    while (line >= 0) {
      // ch will initially be 0 if searching from start of line
      const char = lineContent.charAt(Math.max(ch - 1, 0));
      matchFound = checkCharacter(char);
      if (matchFound) {
        matchedChar = char;
        break;
      }
      ch--;
      // inclusive because (ch - 1) means the first character will already
      // have been checked
      if (ch <= 0) {
        line--;
        if (line >= 0) {
          lineContent = editor.getLine(line);
          ch = lineContent.length;
        }
      }
    }
  } else {
    while (line < editor.lineCount()) {
      const char = lineContent.charAt(ch);
      matchFound = checkCharacter(char);
      if (matchFound) {
        matchedChar = char;
        break;
      }
      ch++;
      if (ch >= lineContent.length) {
        line++;
        lineContent = editor.getLine(line);
        ch = 0;
      }
    }
  }

  return matchFound
    ? {
        match: matchedChar,
        pos: {
          line,
          ch,
        },
      }
    : null;
};
