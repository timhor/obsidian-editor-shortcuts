import CodeMirror from 'codemirror';
import type { Editor } from 'codemirror';
import {
  getLineStartPos,
  getLineEndPos,
  getSelectionBoundaries,
  getLeadingWhitespace,
  wordRangeAtPos,
  findPosOfNextCharacter,
} from '../utils';
import { DIRECTION } from '../constants';

// fixes jsdom type error - https://github.com/jsdom/jsdom/issues/3002#issuecomment-655748833
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = jest.fn();

  range.getClientRects = jest.fn(() => ({
    item: () => null,
    length: 0,
  }));

  return range;
};

describe('Code Editor Shortcuts: utils', () => {
  let editor: Editor;
  const originalDoc = 'lorem ipsum';

  beforeAll(() => {
    editor = CodeMirror(document.body);
  });

  beforeEach(() => {
    editor.setValue(originalDoc);
    editor.setCursor({ line: 0, ch: 0 });
  });

  it('should get line start position', () => {
    const pos = getLineStartPos(0);
    expect(pos).toEqual({ line: 0, ch: 0 });
  });

  it('should get line end position', () => {
    const pos = getLineEndPos(0, editor as any);
    expect(pos).toEqual({ line: 0, ch: 11 });
  });

  it('should get selection boundaries', () => {
    const anchor = { line: 0, ch: 6 };
    const head = { line: 0, ch: 5 };
    const pos = getSelectionBoundaries({ anchor, head });
    expect(pos).toEqual({ from: anchor, to: head });
  });

  it('should get the same selection boundaries if user selects upwards', () => {
    const anchor = { line: 0, ch: 5 };
    const head = { line: 0, ch: 6 };
    const pos = getSelectionBoundaries({ anchor, head });
    expect(pos).toEqual({ from: anchor, to: head });
  });

  it('should get leading whitespace', () => {
    const whitespace = getLeadingWhitespace('  hello');
    expect(whitespace.length).toEqual(2);
  });

  it('should get boundaries of word at given position', () => {
    const range = wordRangeAtPos({ line: 0, ch: 8 }, editor.getLine(0));
    expect(range).toEqual({
      anchor: {
        line: 0,
        ch: 6,
      },
      head: {
        line: 0,
        ch: 11,
      },
    });
  });

  describe('finding position of next occurrence of a given character', () => {
    it('should search forwards', () => {
      const pos = findPosOfNextCharacter({
        editor: editor as any,
        startPos: { line: 0, ch: 5 },
        checkCharacter: (char: string) => /s/.test(char),
        searchDirection: DIRECTION.FORWARD,
      });
      expect(pos).toEqual({
        match: 's',
        pos: {
          line: 0,
          ch: 8,
        },
      });
    });

    it('should search backwards', () => {
      const pos = findPosOfNextCharacter({
        editor: editor as any,
        startPos: { line: 0, ch: 5 },
        checkCharacter: (char: string) => /r/.test(char),
        searchDirection: DIRECTION.BACKWARD,
      });
      expect(pos).toEqual({
        match: 'r',
        pos: {
          line: 0,
          ch: 3,
        },
      });
    });

    it('should return null if no matches', () => {
      const pos = findPosOfNextCharacter({
        editor: editor as any,
        startPos: { line: 0, ch: 0 },
        checkCharacter: (char: string) => /x/.test(char),
        searchDirection: DIRECTION.FORWARD,
      });
      expect(pos).toBeNull();
    });
  });
});
