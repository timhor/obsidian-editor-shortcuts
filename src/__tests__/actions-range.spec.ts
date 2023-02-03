import CodeMirror from 'codemirror';
import type { Editor } from 'codemirror';
import { getDocumentAndSelection } from './test-helpers';
import {
  insertLineAbove,
  insertLineBelow,
  deleteSelectedLines,
  deleteToStartOfLine,
  deleteToEndOfLine,
  joinLines,
  copyLine,
  selectWordOrNextOccurrence,
  selectAllOccurrences,
  selectLine,
  goToLineBoundary,
  navigateLine,
  transformCase,
  expandSelectionToBrackets,
  expandSelectionToQuotes,
  expandSelectionToQuotesOrBrackets,
  addCursorsToSelectionEnds,
  setIsManualSelection,
  insertCursorAbove,
  insertCursorBelow,
} from '../actions';
import { CASE, CODE_EDITOR } from '../constants';
import { withMultipleSelections } from '../utils';

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

describe('Code Editor Shortcuts: actions - single range selection', () => {
  let editor: Editor;
  const originalDoc = 'lorem ipsum\ndolor sit\namet';

  beforeAll(() => {
    editor = CodeMirror(document.body);

    // To make cm.operation() work, since editor here already refers to the
    // CodeMirror object
    (editor as any).cm = editor;

    // Assign the CodeMirror equivalents of posToOffset and offsetToPos
    (editor as any).posToOffset = editor.indexFromPos;
    (editor as any).offsetToPos = editor.posFromIndex;
  });

  beforeEach(() => {
    editor.setValue(originalDoc);
    editor.setSelection({ line: 0, ch: 6 }, { line: 1, ch: 5 });
  });

  describe('insertLineAbove', () => {
    it('should insert line above', () => {
      withMultipleSelections(editor as any, insertLineAbove);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\n\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
    });
  });

  describe('insertLineBelow', () => {
    it('should insert line below', () => {
      withMultipleSelections(editor as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\n\namet');
      expect(cursor.line).toEqual(2);
    });

    it('should insert prefix when inside a list', () => {
      editor.setValue('- aaa\n- bbb');
      editor.setSelection({ line: 0, ch: 2 }, { line: 0, ch: 5 });

      withMultipleSelections(editor as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('- aaa\n- \n- bbb');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 1,
          ch: 2,
        }),
      );
    });
  });

  describe('deleteSelectedLines', () => {
    it('should delete selected lines', () => {
      withMultipleSelections(editor as any, deleteSelectedLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('amet');
      expect(cursor.line).toEqual(0);
    });
  });

  describe('deleteToStartOfLine', () => {
    it('should delete to the start of the line', () => {
      withMultipleSelections(editor as any, deleteToStartOfLine);

      const { doc } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\n sit\namet');
    });
  });

  describe('deleteToEndOfLine', () => {
    it('should delete to the end of the line', () => {
      withMultipleSelections(editor as any, deleteToEndOfLine);

      const { doc } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor\namet');
    });
  });

  describe('joinLines', () => {
    it('should join multiple selected lines', () => {
      withMultipleSelections(editor as any, joinLines);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum dolor sit\namet');
      expect(selections[0]).toEqual({
        anchor: expect.objectContaining({ line: 0, ch: 6 }),
        head: expect.objectContaining({ line: 0, ch: 17 }),
      });
    });

    it('should join the same text from either direction', () => {
      editor.setSelection({ line: 1, ch: 5 }, { line: 0, ch: 6 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum dolor sit\namet');
      expect(selections[0]).toEqual({
        anchor: expect.objectContaining({ line: 0, ch: 6 }),
        head: expect.objectContaining({ line: 0, ch: 17 }),
      });
    });

    it('should not join next line when at the end of the document', () => {
      editor.setSelection({ line: 2, ch: 4 }, { line: 2, ch: 0 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections[0]).toEqual({
        anchor: expect.objectContaining({ line: 2, ch: 0 }),
        head: expect.objectContaining({ line: 2, ch: 4 }),
      });
    });

    it('should remove markdown list characters', () => {
      const content = '- aaa\n- bbb\n- ccc';
      editor.setValue(content);
      editor.setSelection({ line: 2, ch: 4 }, { line: 0, ch: 3 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('- aaa bbb ccc');
      expect(selections[0]).toEqual({
        anchor: expect.objectContaining({ line: 0, ch: 3 }),
        head: expect.objectContaining({ line: 0, ch: 12 }),
      });
    });
  });

  describe('copyLine', () => {
    it('should copy selected lines up', () => {
      withMultipleSelections(editor as any, copyLine, { args: 'up' });

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(
        'lorem ipsum\ndolor sit\nlorem ipsum\ndolor sit\namet',
      );
      expect(selections[0]).toEqual({
        anchor: expect.objectContaining({ line: 0, ch: 6 }),
        head: expect.objectContaining({ line: 1, ch: 5 }),
      });
    });

    it('should copy selected lines down', () => {
      withMultipleSelections(editor as any, copyLine, { args: 'down' });

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(
        'lorem ipsum\ndolor sit\nlorem ipsum\ndolor sit\namet',
      );
      expect(selections[0]).toEqual({
        anchor: expect.objectContaining({ line: 2, ch: 6 }),
        head: expect.objectContaining({ line: 3, ch: 5 }),
      });
    });
  });

  describe('selectWordOrNextOccurrence', () => {
    const originalDocRepeated = `${originalDoc}\n${originalDoc}\n${originalDoc}`;

    it('should not select additional words', () => {
      selectWordOrNextOccurrence(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('ipsum\ndolor');
    });

    it('should select next occurrence of selection', () => {
      editor.setValue(originalDocRepeated);
      editor.setSelection({ line: 1, ch: 6 }, { line: 1, ch: 9 });

      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDocRepeated);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 1, ch: 6 }),
          head: expect.objectContaining({ line: 1, ch: 9 }),
        },
        {
          anchor: expect.objectContaining({ line: 4, ch: 6 }),
          head: expect.objectContaining({ line: 4, ch: 9 }),
        },
        {
          anchor: expect.objectContaining({ line: 7, ch: 6 }),
          head: expect.objectContaining({ line: 7, ch: 9 }),
        },
      ]);
    });

    it('should select next occurrence of selection across newlines', () => {
      editor.setValue(originalDocRepeated);
      editor.setSelection({ line: 1, ch: 5 }, { line: 0, ch: 6 });

      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDocRepeated);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 1, ch: 5 }),
          head: expect.objectContaining({ line: 0, ch: 6 }),
        },
        {
          anchor: expect.objectContaining({ line: 3, ch: 6 }),
          head: expect.objectContaining({ line: 4, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 6, ch: 6 }),
          head: expect.objectContaining({ line: 7, ch: 5 }),
        },
      ]);
    });

    it('should only select whole words if initial selection was made programmatically', () => {
      setIsManualSelection(false);
      editor.setValue('sit sit situation sit');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 3 });

      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('sit sit situation sit');
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 0 }),
          head: expect.objectContaining({ line: 0, ch: 3 }),
        },
        {
          anchor: expect.objectContaining({ line: 0, ch: 4 }),
          head: expect.objectContaining({ line: 0, ch: 7 }),
        },
        {
          anchor: expect.objectContaining({ line: 0, ch: 18 }),
          head: expect.objectContaining({ line: 0, ch: 21 }),
        },
      ]);
    });

    it('should select within words if initial selection was made manually', () => {
      setIsManualSelection(true);
      editor.setValue('sit sit situation sit');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 3 });

      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('sit sit situation sit');
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 0 }),
          head: expect.objectContaining({ line: 0, ch: 3 }),
        },
        {
          anchor: expect.objectContaining({ line: 0, ch: 4 }),
          head: expect.objectContaining({ line: 0, ch: 7 }),
        },
        {
          anchor: expect.objectContaining({ line: 0, ch: 8 }),
          head: expect.objectContaining({ line: 0, ch: 11 }),
        },
        {
          anchor: expect.objectContaining({ line: 0, ch: 18 }),
          head: expect.objectContaining({ line: 0, ch: 21 }),
        },
      ]);
    });

    it('should escape reserved regex characters when finding a match', () => {
      editor.setValue('(hello)\n(hello)\n(hello)');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 7 });

      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);

      const { selections } = getDocumentAndSelection(editor);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 0 }),
          head: expect.objectContaining({ line: 0, ch: 7 }),
        },
        {
          anchor: expect.objectContaining({ line: 1, ch: 0 }),
          head: expect.objectContaining({ line: 1, ch: 7 }),
        },
        {
          anchor: expect.objectContaining({ line: 2, ch: 0 }),
          head: expect.objectContaining({ line: 2, ch: 7 }),
        },
      ]);
    });

    it('should loop around to beginning when selecting next occurrence', () => {
      editor.setValue(originalDocRepeated);
      editor.setSelection({ line: 4, ch: 0 }, { line: 4, ch: 5 });

      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDocRepeated);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 1, ch: 0 }),
          head: expect.objectContaining({ line: 1, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 4, ch: 0 }),
          head: expect.objectContaining({ line: 4, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 7, ch: 0 }),
          head: expect.objectContaining({ line: 7, ch: 5 }),
        },
      ]);
    });

    describe('with words containing unicode characters', () => {
      it('should only select whole words if initial selection was made programmatically', () => {
        setIsManualSelection(false);
        editor.setValue('café café cafés café');
        editor.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 9 });

        selectWordOrNextOccurrence(editor as any);
        selectWordOrNextOccurrence(editor as any);
        selectWordOrNextOccurrence(editor as any);

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual('café café cafés café');
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 0 }),
            head: expect.objectContaining({ line: 0, ch: 4 }),
          },
          {
            anchor: expect.objectContaining({ line: 0, ch: 5 }),
            head: expect.objectContaining({ line: 0, ch: 9 }),
          },
          {
            anchor: expect.objectContaining({ line: 0, ch: 16 }),
            head: expect.objectContaining({ line: 0, ch: 20 }),
          },
        ]);
      });

      it('should select within words if initial selection was made manually', () => {
        setIsManualSelection(true);
        editor.setValue('café café cafés café');
        editor.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 9 });

        selectWordOrNextOccurrence(editor as any);
        selectWordOrNextOccurrence(editor as any);
        selectWordOrNextOccurrence(editor as any);

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual('café café cafés café');
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 0 }),
            head: expect.objectContaining({ line: 0, ch: 4 }),
          },
          {
            anchor: expect.objectContaining({ line: 0, ch: 5 }),
            head: expect.objectContaining({ line: 0, ch: 9 }),
          },
          {
            anchor: expect.objectContaining({ line: 0, ch: 10 }),
            head: expect.objectContaining({ line: 0, ch: 14 }),
          },
          {
            anchor: expect.objectContaining({ line: 0, ch: 16 }),
            head: expect.objectContaining({ line: 0, ch: 20 }),
          },
        ]);
      });
    });
  });

  describe('selectAllOccurrences', () => {
    const originalDocRepeated = `${originalDoc}\n${originalDoc}\n${originalDoc}`;

    it('should select all occurrences of selection', () => {
      editor.setValue(originalDocRepeated);
      editor.setSelection({ line: 0, ch: 6 }, { line: 0, ch: 11 });

      selectAllOccurrences(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDocRepeated);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 6 }),
          head: expect.objectContaining({ line: 0, ch: 11 }),
        },
        {
          anchor: expect.objectContaining({ line: 3, ch: 6 }),
          head: expect.objectContaining({ line: 3, ch: 11 }),
        },
        {
          anchor: expect.objectContaining({ line: 6, ch: 6 }),
          head: expect.objectContaining({ line: 6, ch: 11 }),
        },
      ]);
    });

    it('should select all occurrences of selection across newlines', () => {
      editor.setValue(originalDocRepeated);
      editor.setSelection({ line: 4, ch: 5 }, { line: 3, ch: 6 });

      selectAllOccurrences(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDocRepeated);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 6 }),
          head: expect.objectContaining({ line: 1, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 3, ch: 6 }),
          head: expect.objectContaining({ line: 4, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 6, ch: 6 }),
          head: expect.objectContaining({ line: 7, ch: 5 }),
        },
      ]);
    });

    it('should select all occurrences of selection containing unicode characters', () => {
      editor.setValue('ああ ああ ああ');
      editor.setSelection({ line: 0, ch: 6 }, { line: 0, ch: 8 });

      selectAllOccurrences(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('ああ ああ ああ');
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 0 }),
          head: expect.objectContaining({ line: 0, ch: 2 }),
        },
        {
          anchor: expect.objectContaining({ line: 0, ch: 3 }),
          head: expect.objectContaining({ line: 0, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 0, ch: 6 }),
          head: expect.objectContaining({ line: 0, ch: 8 }),
        },
      ]);
    });

    it('should escape reserved regex characters when finding a match', () => {
      editor.setValue('(hello)\n(hello)\n(hello)');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 7 });

      selectAllOccurrences(editor as any);

      const { selections } = getDocumentAndSelection(editor);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 0 }),
          head: expect.objectContaining({ line: 0, ch: 7 }),
        },
        {
          anchor: expect.objectContaining({ line: 1, ch: 0 }),
          head: expect.objectContaining({ line: 1, ch: 7 }),
        },
        {
          anchor: expect.objectContaining({ line: 2, ch: 0 }),
          head: expect.objectContaining({ line: 2, ch: 7 }),
        },
      ]);
    });
  });

  describe('selectLine', () => {
    it('should select lines', () => {
      withMultipleSelections(editor as any, selectLine);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('lorem ipsum\ndolor sit\n');
    });
  });

  describe('addCursorsToSelectionEnds', () => {
    it('should add cursors to selection ends when emulating VS Code', () => {
      addCursorsToSelectionEnds(editor as any, CODE_EDITOR.VSCODE);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 11 }),
          head: expect.objectContaining({ line: 0, ch: 11 }),
        },
        {
          anchor: expect.objectContaining({ line: 1, ch: 5 }),
          head: expect.objectContaining({ line: 1, ch: 5 }),
        },
      ]);
    });

    it('should add cursors to selection ends when emulating Sublime Text', () => {
      addCursorsToSelectionEnds(editor as any, CODE_EDITOR.SUBLIME);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 6 }),
          head: expect.objectContaining({ line: 0, ch: 11 }),
        },
        {
          anchor: expect.objectContaining({ line: 1, ch: 0 }),
          head: expect.objectContaining({ line: 1, ch: 5 }),
        },
      ]);
    });
  });

  describe('goToLineBoundary', () => {
    it('should go to line start', () => {
      withMultipleSelections(editor as any, goToLineBoundary, {
        args: 'start',
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(0);
    });

    it('should go to line end', () => {
      withMultipleSelections(editor as any, goToLineBoundary, {
        args: 'end',
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });
  });

  describe('navigateLine', () => {
    it('should navigate to the previous line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'prev' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(5);
    });

    it('should navigate to the next line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'next' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });

    it('should navigate to the first line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'first' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(0);
    });

    it('should navigate to the last line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'last' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });
  });

  describe('transformCase', () => {
    it('should transform to uppercase', () => {
      withMultipleSelections(editor as any, transformCase, {
        args: CASE.UPPER,
      });

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem IPSUM\nDOLOR sit\namet');
      expect(selectedText).toEqual('IPSUM\nDOLOR');
    });

    it('should transform to lowercase', () => {
      editor.setValue('lorem ipsum\nDOLOR sit\namet');
      editor.setSelection({ line: 0, ch: 6 }, { line: 1, ch: 5 });

      withMultipleSelections(editor as any, transformCase, {
        args: CASE.LOWER,
      });

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\namet');
      expect(selectedText).toEqual('ipsum\ndolor');
    });

    it('should transform to title case', () => {
      withMultipleSelections(editor as any, transformCase, {
        args: CASE.TITLE,
      });

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem Ipsum\nDolor sit\namet');
      expect(selectedText).toEqual('Ipsum\nDolor');
    });

    it.each([
      ['default', 'lorem Ipsum dolor', 'LOREM IPSUM DOLOR'],
      ['uppercase', 'LOREM IPSUM DOLOR', 'lorem ipsum dolor'],
      ['lowercase', 'lorem ipsum dolor', 'Lorem Ipsum Dolor'],
      ['title case', 'Lorem Ipsum Dolor', 'LOREM IPSUM DOLOR'],
    ])(
      'should cycle to next case from %s',
      (_scenario, initialContent, expectedContent) => {
        editor.setValue(initialContent);
        editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 17 });

        withMultipleSelections(editor as any, transformCase, {
          args: CASE.NEXT,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(expectedContent);
        expect(selections[0]).toEqual({
          anchor: { line: 0, ch: 0 },
          head: { line: 0, ch: 17 },
        });
      },
    );

    it("should not transform 'the', 'a' or 'an' to title case if not the first word", () => {
      editor.setValue(
        'AN EXAMPLE TO TEST THE OBSIDIAN PLUGIN AND A CASE CONVERSION FEATURE',
      );
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 68 });

      withMultipleSelections(editor as any, transformCase, {
        args: CASE.TITLE,
      });

      const { doc } = getDocumentAndSelection(editor);
      expect(doc).toEqual(
        'An Example To Test the Obsidian Plugin And a Case Conversion Feature',
      );
    });
  });

  describe('expandSelectionToBrackets', () => {
    it.each([
      ['()', 'lorem (ipsum\ndolor sit\nam)et'],
      ['[]', 'lorem [ipsum\ndolor sit\nam]et'],
      ['{}', 'lorem {ipsum\ndolor sit\nam}et'],
    ])(
      'should expand selection to %s brackets if entire selection is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 5 });

        withMultipleSelections(editor as any, expandSelectionToBrackets);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('ipsum\ndolor sit\nam');
      },
    );

    it('should not expand selection to brackets if part of selection is outside', () => {
      const content = '(lorem ipsum)\ndolor';
      editor.setValue(content);
      editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 2 });

      withMultipleSelections(editor as any, expandSelectionToBrackets);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('um)\ndo');
    });
  });

  describe('expandSelectionToQuotes', () => {
    it.each([
      ['single', "lorem 'ipsum\ndolor'"],
      ['double', 'lorem "ipsum\ndolor"'],
    ])(
      'should expand selection to %s quotes if entire selection is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 2 });

        withMultipleSelections(editor as any, expandSelectionToQuotes);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('ipsum\ndolor');
      },
    );

    it('should not expand selection to quotes if part of selection is outside', () => {
      const content = '"lorem ipsum"\ndolor';
      editor.setValue(content);
      editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 2 });

      withMultipleSelections(editor as any, expandSelectionToQuotes);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('um"\ndo');
    });
  });

  describe('expandSelectionToQuotesOrBrackets', () => {
    it.each([
      ['quotes', '("lorem ipsum" dolor)'],
      ['brackets', '"(lorem ipsum) dolor"'],
    ])('should expand selection to %s', (_scenario, content) => {
      editor.setValue(content);
      editor.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 13 });

      expandSelectionToQuotesOrBrackets(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('lorem ipsum');
    });
  });

  describe('insertCursorAbove', () => {
    it('should insert cursor above with the same range', () => {
      editor.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 3 });

      insertCursorAbove(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 3 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 3 } },
      ]);
    });

    it('should insert cursor above with shortened range if previous line is shorter', () => {
      editor.setValue('aaa\nbbbbbb');
      editor.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 5 });

      insertCursorAbove(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('aaa\nbbbbbb');
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 3 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 5 } },
      ]);
    });
  });

  describe('insertCursorBelow', () => {
    it('should insert cursor below with the same range', () => {
      editor.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 3 });

      insertCursorBelow(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 3 } },
        { anchor: { line: 2, ch: 0 }, head: { line: 2, ch: 3 } },
      ]);
    });

    it('should insert cursor below with shortened range if next line is shorter', () => {
      editor.setValue('aaaaaa\nbbb');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      insertCursorBelow(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('aaaaaa\nbbb');
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 3 } },
      ]);
    });
  });
});
