import { EditorView } from '@codemirror/view';
import {
  defineLegacyEditorMethods,
  EditorViewWithLegacyMethods,
} from './test-helpers';
import {
  defaultMultipleSelectionOptions,
  withMultipleSelections,
  getLineStartPos,
  getLineEndPos,
  getSelectionBoundaries,
  getLeadingWhitespace,
  wordRangeAtPos,
  findPosOfNextCharacter,
  isNumeric,
  getNextListPrefix,
} from '../utils';
import { SEARCH_DIRECTION } from '../constants';

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
  let editor: EditorViewWithLegacyMethods;
  const originalDoc = 'lorem ipsum';

  beforeAll(() => {
    editor = new EditorView({ parent: document.body });
    defineLegacyEditorMethods(editor);
  });

  beforeEach(() => {
    editor.setValue(originalDoc);
    editor.setCursor({ line: 0, ch: 0 });
  });

  describe('withMultipleSelections', () => {
    const emptyResult = {
      changes: [] as any[],
      newSelection: { from: { line: 0, ch: 0 } },
    };
    const firstWordSelection = {
      anchor: { line: 0, ch: 2 },
      head: { line: 0, ch: 2 },
    };
    const secondWordSelection = {
      anchor: { line: 0, ch: 8 },
      head: { line: 0, ch: 11 },
    };
    let mockCallback: jest.Mock;

    beforeEach(() => {
      editor.setSelections([firstWordSelection, secondWordSelection]);
      mockCallback = jest.fn().mockReturnValue(emptyResult);
    });

    it('should execute callback for each editor selection', () => {
      withMultipleSelections(editor as any, mockCallback);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should forward any arguments to the callback along with the iteration', () => {
      withMultipleSelections(editor as any, mockCallback, {
        ...defaultMultipleSelectionOptions,
        args: { foo: 'bar' },
      });
      expect(mockCallback).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ foo: 'bar', iteration: 0 }),
      );
      expect(mockCallback).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ foo: 'bar', iteration: 1 }),
      );
    });

    it('should filter out subsequent selections on the same line if repeatSameLineActions is false', () => {
      withMultipleSelections(editor as any, mockCallback, {
        repeatSameLineActions: false,
      });
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.anything(),
        firstWordSelection,
        expect.objectContaining({ iteration: 0 }),
      );
    });
  });

  describe('getLineStartPos', () => {
    it('should get line start position', () => {
      const pos = getLineStartPos(0);
      expect(pos).toEqual({ line: 0, ch: 0 });
    });
  });

  describe('getLineEndPos', () => {
    it('should get line end position', () => {
      const pos = getLineEndPos(0, editor as any);
      expect(pos).toEqual({ line: 0, ch: 11 });
    });
  });

  describe('getSelectionBoundaries', () => {
    it('should get selection boundaries', () => {
      const anchor = { line: 0, ch: 5 };
      const head = { line: 0, ch: 6 };
      const pos = getSelectionBoundaries({ anchor, head });
      expect(pos).toEqual({
        from: anchor,
        to: head,
        hasTrailingNewline: false,
      });
    });

    it('should swap selection boundaries if user selects upwards', () => {
      const anchor = { line: 1, ch: 5 };
      const head = { line: 0, ch: 6 };
      const pos = getSelectionBoundaries({ anchor, head });
      expect(pos).toEqual({
        from: head,
        to: anchor,
        hasTrailingNewline: false,
      });
    });

    it('should swap selection boundaries if user selects backwards on the same line', () => {
      const anchor = { line: 0, ch: 8 };
      const head = { line: 0, ch: 4 };
      const pos = getSelectionBoundaries({ anchor, head });
      expect(pos).toEqual({
        from: head,
        to: anchor,
        hasTrailingNewline: false,
      });
    });

    it('should determine if selection has a trailing newline', () => {
      const anchor = { line: 0, ch: 0 };
      const head = { line: 1, ch: 0 };
      const pos = getSelectionBoundaries({ anchor, head });
      expect(pos).toEqual({ from: anchor, to: head, hasTrailingNewline: true });
    });
  });

  describe('getLeadingWhitespace', () => {
    it('should get leading whitespace', () => {
      const whitespace = getLeadingWhitespace('  hello');
      expect(whitespace.length).toEqual(2);
    });
  });

  describe('wordRangeAtPos', () => {
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
  });

  describe('findPosOfNextCharacter', () => {
    it('should search forwards', () => {
      const pos = findPosOfNextCharacter({
        editor: editor as any,
        startPos: { line: 0, ch: 5 },
        checkCharacter: (char: string) => /s/.test(char),
        searchDirection: SEARCH_DIRECTION.FORWARD,
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
        searchDirection: SEARCH_DIRECTION.BACKWARD,
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
        searchDirection: SEARCH_DIRECTION.FORWARD,
      });
      expect(pos).toBeNull();
    });
  });

  describe('isNumeric', () => {
    it('should return true if input string is numeric', () => {
      expect(isNumeric('1.')).toBe(true);
    });

    it('should return false if input string is non-numeric', () => {
      expect(isNumeric('-')).toBe(false);
    });

    it('should return false if input string is empty', () => {
      expect(isNumeric('')).toBe(false);
    });
  });

  describe('getNextListPrefix', () => {
    it.each([['- '], ['* '], ['+ '], ['> '], ['- [ ] ']])(
      'should return the same prefix for %s',
      (currentPrefix) => {
        const prefix = getNextListPrefix(
          `${currentPrefix} lorem ipsum`,
          'after',
        );
        expect(prefix).toBe(currentPrefix);
      },
    );

    it('should return the next number for a numeric prefix when going forwards', () => {
      const prefix = getNextListPrefix('23. lorem ipsum', 'after');
      expect(prefix).toBe('24. ');
    });

    it('should return the same number for a numeric prefix when going backwards', () => {
      const prefix = getNextListPrefix('23. lorem ipsum', 'before');
      expect(prefix).toBe('23. ');
    });

    it('should return an unticked checkbox for a checkbox prefix', () => {
      const prefix = getNextListPrefix('- [x] lorem ipsum', 'after');
      expect(prefix).toBe('- [ ] ');
    });

    it('should return no prefix for frontmatter fence', () => {
      const prefix = getNextListPrefix('---', 'after');
      expect(prefix).toBe('');
    });

    it('should return no prefix for other non-numeric characters', () => {
      const prefix = getNextListPrefix('x', 'after');
      expect(prefix).toBe('');
    });

    it('should return null if list item is empty', () => {
      const prefix = getNextListPrefix('- ', 'after');
      expect(prefix).toBeNull();
    });
  });
});
