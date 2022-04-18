import CodeMirror from 'codemirror';
import type { Editor } from 'codemirror';
import { getDocumentAndSelection } from './test-helpers';
import {
  insertLineAbove,
  insertLineBelow,
  deleteSelectedLines,
  deleteToEndOfLine,
  joinLines,
  copyLine,
  selectWord,
  selectLine,
  goToLineBoundary,
  navigateLine,
  moveCursor,
  transformCase,
  expandSelectionToBrackets,
  expandSelectionToQuotes,
  expandSelectionToQuotesOrBrackets,
  addCursorsToSelectionEnds,
} from '../actions';
import { CASE, CODE_EDITOR, DIRECTION } from '../constants';
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
  });

  describe('deleteSelectedLines', () => {
    it('should delete selected lines', () => {
      withMultipleSelections(editor as any, deleteSelectedLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('amet');
      expect(cursor.line).toEqual(0);
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
    it('should join next line to current line', () => {
      withMultipleSelections(editor as any, joinLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit amet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });

    it('should not join next line when at the end of the document', () => {
      editor.setSelection({ line: 1, ch: 6 }, { line: 2, ch: 2 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });

    it('should remove markdown list characters', () => {
      const content = '- aaa\n- bbb\n- ccc';
      editor.setValue(content);
      editor.setSelection({ line: 1, ch: 4 }, { line: 0, ch: 3 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('- aaa bbb\n- ccc');
      expect(selections[0]).toEqual({
        anchor: expect.objectContaining({ line: 0, ch: 5 }),
        head: expect.objectContaining({ line: 0, ch: 5 }),
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

  describe('selectWord', () => {
    it('should not select additional words', () => {
      withMultipleSelections(editor as any, selectWord);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('ipsum\ndolor');
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
      withMultipleSelections(editor as any, navigateLine, { args: 'up' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(5);
    });

    it('should navigate to the next line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'down' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });
  });

  describe('moveCursor', () => {
    it('should navigate the cursor backward', () => {
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.BACKWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(4);
    });

    it('should navigate the cursor forward', () => {
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.FORWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(6);
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
});
