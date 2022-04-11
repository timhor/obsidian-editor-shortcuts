import {
  Editor,
  EditorPosition,
  EditorSelection,
  EditorSelectionOrCaret,
} from 'obsidian';
import { DIRECTION } from './constants';
import { CustomSelectionHandler } from './custom-selection-handlers';

type EditorActionCallback = (
  editor: Editor,
  selection: EditorSelection,
  args: string,
) => EditorSelectionOrCaret;

type MultipleSelectionOptions = {
  // Additional information to be passed to the EditorActionCallback
  args?: string;

  // Perform further processing of new selections before they are set
  customSelectionHandler?: CustomSelectionHandler;

  // Whether the action should be repeated for cursors on the same line
  repeatSameLineActions?: boolean;
};

export const defaultMultipleSelectionOptions = { repeatSameLineActions: true };

export const withMultipleSelections = (
  editor: Editor,
  callback: EditorActionCallback,
  options: MultipleSelectionOptions = defaultMultipleSelectionOptions,
) => {
  // @ts-expect-error: Obsidian's Editor interface does not explicitly
  // include the CodeMirror cm object, but it is there when logged out
  // (this may break in future versions of the Obsidian API)
  const { cm } = editor;

  let selections = editor.listSelections();
  let newSelections: EditorSelectionOrCaret[] = [];

  if (!options.repeatSameLineActions) {
    const seenLines: number[] = [];
    selections = selections.filter((selection) => {
      const currentLine = selection.head.line;
      if (!seenLines.includes(currentLine)) {
        seenLines.push(currentLine);
        return true;
      }
      return false;
    });
  }

  const applyCallbackOnSelections = () => {
    for (let i = 0; i < selections.length; i++) {
      // Can't reuse selections variable as positions may change on each iteration
      const selection = editor.listSelections()[i];

      // Selections may disappear (e.g. running delete line for two cursors on the same line)
      if (selection) {
        const newSelection = callback(editor, selection, options.args);
        newSelections.push(newSelection);
      }
    }

    if (options.customSelectionHandler) {
      newSelections = options.customSelectionHandler(newSelections);
    }
    editor.setSelections(newSelections);
  };

  if (cm) {
    // Group all the updates into one atomic operation (so undo/redo work as expected)
    cm.operation(applyCallbackOnSelections);
  } else {
    // Safe fallback if cm doesn't exist (so undo/redo will step through each change)
    console.error('cm object not found, operations will not be buffered');
    applyCallbackOnSelections();
  }
};

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

  // in case user selects backwards on the same line
  if (from.line === to.line && from.ch > to.ch) {
    [from, to] = [to, from];
  }

  return { from, to };
};

export const getLeadingWhitespace = (lineContent: string) => {
  const indentation = lineContent.match(/^\s+/);
  return indentation ? indentation[0] : '';
};

// Match any character from any language: https://www.regular-expressions.info/unicode.html
const isLetterCharacter = (char: string) => /\p{L}\p{M}*/u.test(char);

export const wordRangeAtPos = (
  pos: EditorPosition,
  lineContent: string,
): { anchor: EditorPosition; head: EditorPosition } => {
  let start = pos.ch;
  let end = pos.ch;
  while (start > 0 && isLetterCharacter(lineContent.charAt(start - 1))) {
    start--;
  }
  while (
    end < lineContent.length &&
    isLetterCharacter(lineContent.charAt(end))
  ) {
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
