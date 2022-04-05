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
} from '../actions';
import { CASE, DIRECTION } from '../constants';
import {
  withMultipleSelections,
  defaultMultipleSelectionOptions,
} from '../utils';
import { insertLineBelowHandler } from '../custom-selection-handlers';

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

describe('Code Editor Shortcuts: actions', () => {
  let editor: Editor;
  const originalDoc = 'lorem ipsum\ndolor sit\namet';

  beforeAll(() => {
    editor = CodeMirror(document.body);
    // To make cm.operation() work, since editor here already refers to the
    // CodeMirror object
    (editor as any).cm = editor;
  });

  describe('single cursor selection', () => {
    beforeEach(() => {
      editor.setValue(originalDoc);
      editor.setCursor({ line: 1, ch: 0 });
    });

    describe('insertLineAbove', () => {
      it('should insert line above', () => {
        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\n\ndolor sit\namet');
        expect(cursor.line).toEqual(1);
      });

      it('should insert line above first line', () => {
        editor.setCursor({ line: 0, ch: 0 });

        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('\nlorem ipsum\ndolor sit\namet');
        expect(cursor.line).toEqual(0);
      });
    });

    describe('insertLineBelow', () => {
      it('should insert line below', () => {
        withMultipleSelections(editor as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sit\n\namet');
        expect(cursor.line).toEqual(2);
      });

      it('should insert line below with the same indentation level', () => {
        editor.setValue('    lorem ipsum\n    dolor sit\n    amet');
        editor.setCursor({ line: 1, ch: 0 });

        withMultipleSelections(editor as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('    lorem ipsum\n    dolor sit\n    \n    amet');
        expect(cursor.line).toEqual(2);
        expect(cursor.ch).toEqual(4);
      });

      it('should insert line below last line', () => {
        editor.setCursor({ line: 2, ch: 0 });

        withMultipleSelections(editor as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sit\namet\n');
        expect(cursor.line).toEqual(3);
      });
    });

    describe('deleteSelectedLines', () => {
      it('should delete line at cursor', () => {
        withMultipleSelections(editor as any, deleteSelectedLines);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\namet');
        expect(cursor.line).toEqual(1);
      });

      it('should delete last line', () => {
        editor.setCursor({ line: 2, ch: 0 });

        withMultipleSelections(editor as any, deleteSelectedLines);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sit');
        expect(cursor.line).toEqual(1);
      });
    });

    describe('deleteToEndOfLine', () => {
      it('should delete to the end of the line', () => {
        editor.setCursor({ line: 1, ch: 1 });
        withMultipleSelections(editor as any, deleteToEndOfLine);

        const { doc } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\nd\namet');
      });

      it('should delete the newline when at the end of the line', () => {
        editor.setCursor({ line: 1, ch: 9 });
        withMultipleSelections(editor as any, deleteToEndOfLine);

        const { doc } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sitamet');
      });

      it('should delete nothing when at the end of the document', () => {
        editor.setCursor({ line: 2, ch: 4 });
        withMultipleSelections(editor as any, deleteToEndOfLine);

        const { doc } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sit\namet');
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
    });

    describe('copyLine', () => {
      it('should copy current line up', () => {
        editor.setCursor({ line: 1, ch: 3 });

        withMultipleSelections(editor as any, copyLine, {
          args: 'up',
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sit\ndolor sit\namet');
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(3);
      });

      it('should copy current line up from the end of a line', () => {
        editor.setCursor({ line: 1, ch: 9 });

        withMultipleSelections(editor as any, copyLine, {
          args: 'up',
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sit\ndolor sit\namet');
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(9);
      });

      it('should copy current line down', () => {
        editor.setCursor({ line: 1, ch: 3 });

        withMultipleSelections(editor as any, copyLine, {
          args: 'down',
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\ndolor sit\ndolor sit\namet');
        expect(cursor.line).toEqual(2);
        expect(cursor.ch).toEqual(3);
      });
    });

    describe('selectWord', () => {
      it('should select word', () => {
        withMultipleSelections(editor as any, selectWord);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(selectedText).toEqual('dolor');
      });
    });

    describe('selectLine', () => {
      it('should select line', () => {
        withMultipleSelections(editor as any, selectLine);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(selectedText).toEqual('dolor sit\n');
      });
    });

    describe('goToLineBoundary', () => {
      it('should go to line start', () => {
        withMultipleSelections(editor as any, goToLineBoundary, {
          args: 'start',
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(1);
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
        editor.setCursor({ line: 2, ch: 0 });
        withMultipleSelections(editor as any, navigateLine, { args: 'up' });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(0);
      });

      it('should not navigate past the start of the document', () => {
        editor.setCursor({ line: 0, ch: 0 });
        withMultipleSelections(editor as any, navigateLine, { args: 'up' });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(0);
        expect(cursor.ch).toEqual(0);
      });

      it('should navigate to the next line', () => {
        withMultipleSelections(editor as any, navigateLine, { args: 'down' });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(2);
        expect(cursor.ch).toEqual(0);
      });

      it('should not navigate past the end of the document', () => {
        editor.setCursor({ line: 2, ch: 4 });
        withMultipleSelections(editor as any, navigateLine, { args: 'down' });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(2);
        expect(cursor.ch).toEqual(4);
      });

      it('should snap to the end of the line', () => {
        editor.setValue('line zero\nzz\nline two');
        editor.setCursor({ line: 0, ch: 5 });

        withMultipleSelections(editor as any, navigateLine, { args: 'down' });

        const { cursor } = getDocumentAndSelection(editor);
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(2);
      });
    });

    describe('moveCursor', () => {
      it('should navigate the cursor backward', () => {
        editor.setCursor({ line: 2, ch: 2 });
        withMultipleSelections(editor as any, moveCursor, {
          args: DIRECTION.BACKWARD,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(2);
        expect(cursor.ch).toEqual(1);
      });

      it('should navigate the cursor backward over a line boundary', () => {
        withMultipleSelections(editor as any, moveCursor, {
          args: DIRECTION.BACKWARD,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(0);
        expect(cursor.ch).toEqual(11);
      });

      it('should not attempt to navigate the cursor past start of document', () => {
        editor.setCursor({ line: 0, ch: 0 });
        withMultipleSelections(editor as any, moveCursor, {
          args: DIRECTION.BACKWARD,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(0);
        expect(cursor.ch).toEqual(0);
      });

      it('should navigate the cursor forward', () => {
        withMultipleSelections(editor as any, moveCursor, {
          args: DIRECTION.FORWARD,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(1);
      });

      it('should navigate the cursor forward over a line boundary', () => {
        editor.setCursor({ line: 1, ch: 9 });
        withMultipleSelections(editor as any, moveCursor, {
          args: DIRECTION.FORWARD,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(2);
        expect(cursor.ch).toEqual(0);
      });

      it('should not attempt to navigate the cursor past end of document', () => {
        editor.setCursor({ line: 2, ch: 4 });
        withMultipleSelections(editor as any, moveCursor, {
          args: DIRECTION.FORWARD,
        });

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

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\nDOLOR sit\namet');
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(0);
      });

      it('should transform to lowercase', () => {
        editor.setValue('lorem ipsum\nDOLOR sit\namet');
        editor.setCursor({ line: 1, ch: 0 });

        withMultipleSelections(editor as any, transformCase, {
          args: CASE.LOWER,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(originalDoc);
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(0);
      });

      it('should transform to title case', () => {
        withMultipleSelections(editor as any, transformCase, {
          args: CASE.TITLE,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('lorem ipsum\nDolor sit\namet');
        expect(cursor.line).toEqual(1);
        expect(cursor.ch).toEqual(0);
      });
    });

    describe('expandSelectionToBrackets', () => {
      it.each([
        ['()', '(lorem ipsum) dolor'],
        ['[]', 'dolor [lorem ipsum]'],
        ['{}', 'dolor {lorem ipsum} sit amet'],
      ])(
        'should expand selection to %s brackets if cursor is inside',
        (_scenario, content) => {
          editor.setValue(content);
          editor.setCursor({ line: 0, ch: 8 });

          withMultipleSelections(editor as any, expandSelectionToBrackets);

          const { doc, selectedText } = getDocumentAndSelection(editor);
          expect(doc).toEqual(content);
          expect(selectedText).toEqual('lorem ipsum');
        },
      );

      it('should not expand selection to brackets if cursor is outside', () => {
        const content = '(lorem ipsum) dolor';
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 15 });

        withMultipleSelections(editor as any, expandSelectionToBrackets);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('');
      });

      it('should not expand selection to mismatched brackets', () => {
        const content = '(lorem ipsum] dolor';
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 6 });

        withMultipleSelections(editor as any, expandSelectionToBrackets);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('');
      });
    });

    describe('expandSelectionToQuotes', () => {
      it.each([
        ['single', "'lorem ipsum' dolor"],
        ['double', 'dolor "lorem ipsum"'],
      ])(
        'should expand selection to %s quotes if cursor is inside',
        (_scenario, content) => {
          editor.setValue(content);
          editor.setCursor({ line: 0, ch: 8 });

          withMultipleSelections(editor as any, expandSelectionToQuotes);

          const { doc, selectedText } = getDocumentAndSelection(editor);
          expect(doc).toEqual(content);
          expect(selectedText).toEqual('lorem ipsum');
        },
      );

      it('should not expand selection to quotes if cursor is outside', () => {
        const content = '"lorem ipsum" dolor';
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 15 });

        withMultipleSelections(editor as any, expandSelectionToQuotes);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('');
      });

      it('should not expand selection to mismatched quotes', () => {
        const content = '\'lorem ipsum" dolor';
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 6 });

        withMultipleSelections(editor as any, expandSelectionToQuotes);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('');
      });
    });
  });

  describe('single range selection', () => {
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
  });

  describe('multiple mixed selections', () => {
    const extension = `\n\nconsectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`;
    const extendedDoc = originalDoc + extension;

    const originalSelectionRanges = [
      {
        anchor: expect.objectContaining({ line: 1, ch: 5 }),
        head: expect.objectContaining({ line: 0, ch: 6 }),
      },
      {
        anchor: expect.objectContaining({ line: 2, ch: 2 }),
        head: expect.objectContaining({ line: 2, ch: 2 }),
      },
      {
        anchor: expect.objectContaining({ line: 4, ch: 14 }),
        head: expect.objectContaining({ line: 4, ch: 17 }),
      },
      {
        anchor: expect.objectContaining({ line: 4, ch: 26 }),
        head: expect.objectContaining({ line: 4, ch: 26 }),
      },
    ];

    beforeEach(() => {
      editor.setValue(extendedDoc);
      editor.setSelections([
        { anchor: { line: 1, ch: 5 }, head: { line: 0, ch: 6 } }, // {<}ipsum\ndolor{>}
        { anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 2 } }, // am{<>}et
        { anchor: { line: 4, ch: 14 }, head: { line: 4, ch: 17 } }, // a{<}dip{>}iscing
        { anchor: { line: 4, ch: 26 }, head: { line: 4, ch: 26 } }, // '{<>}elit
      ]);
    });

    describe('insertLineAbove', () => {
      it('should insert line above', () => {
        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(`\nlorem ipsum\ndolor sit\n\namet\n\n${extension}`);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 0 }),
            head: expect.objectContaining({ line: 0, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 3, ch: 0 }),
            head: expect.objectContaining({ line: 3, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 6, ch: 0 }),
            head: expect.objectContaining({ line: 6, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 7, ch: 0 }),
            head: expect.objectContaining({ line: 7, ch: 0 }),
          },
        ]);
      });
    });

    describe('insertLineBelow', () => {
      it('should insert lines below', () => {
        withMultipleSelections(editor as any, insertLineBelow, {
          ...defaultMultipleSelectionOptions,
          customSelectionHandler: insertLineBelowHandler,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem ipsum\n\ndolor sit\namet\n\n\n` +
            `consectetur "adipiscing" 'elit'\n\n\n(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 1, ch: 0 }),
            head: expect.objectContaining({ line: 1, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 0 }),
            head: expect.objectContaining({ line: 4, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 7, ch: 0 }),
            head: expect.objectContaining({ line: 7, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 8, ch: 0 }),
            head: expect.objectContaining({ line: 8, ch: 0 }),
          },
        ]);
      });
    });

    describe('deleteSelectedLines', () => {
      it('should delete selected lines', () => {
        withMultipleSelections(editor as any, deleteSelectedLines);

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(`\n(donec [mattis])\ntincidunt metus`);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 0 }),
            head: expect.objectContaining({ line: 0, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 1, ch: 16 }),
            head: expect.objectContaining({ line: 1, ch: 16 }),
          },
        ]);
      });
    });

    describe('deleteToEndOfLine', () => {
      it('should delete to the end of the lines', () => {
        withMultipleSelections(editor as any, deleteToEndOfLine);

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem \ndolor sit\nam\n\n` +
            `consectetur "adip\n(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 1, ch: 5 }),
            head: expect.objectContaining({ line: 0, ch: 6 }),
          },
          {
            anchor: expect.objectContaining({ line: 2, ch: 2 }),
            head: expect.objectContaining({ line: 2, ch: 2 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 14 }),
            head: expect.objectContaining({ line: 4, ch: 17 }),
          },
        ]);
      });
    });

    describe('joinLines', () => {
      it('should join next lines to current lines', () => {
        withMultipleSelections(editor as any, joinLines, {
          ...defaultMultipleSelectionOptions,
          repeatSameLineActions: false,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem ipsum dolor sit\namet\nconsectetur "adipiscing" 'elit' ` +
            `(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 11 }),
            head: expect.objectContaining({ line: 0, ch: 11 }),
          },
          {
            anchor: expect.objectContaining({ line: 1, ch: 4 }),
            head: expect.objectContaining({ line: 1, ch: 4 }),
          },
          {
            anchor: expect.objectContaining({ line: 2, ch: 31 }),
            head: expect.objectContaining({ line: 2, ch: 31 }),
          },
        ]);
      });
    });

    describe('copyLine', () => {
      it('should copy selected lines up', () => {
        withMultipleSelections(editor as any, copyLine, {
          ...defaultMultipleSelectionOptions,
          args: 'up',
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem ipsum\ndolor sit\nlorem ipsum\ndolor sit\namet\namet\n\n` +
            `consectetur "adipiscing" 'elit'\nconsectetur "adipiscing" 'elit'\n` +
            `consectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 1, ch: 5 }),
            head: expect.objectContaining({ line: 0, ch: 6 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 2 }),
            head: expect.objectContaining({ line: 4, ch: 2 }),
          },
          {
            anchor: expect.objectContaining({ line: 7, ch: 14 }),
            head: expect.objectContaining({ line: 7, ch: 17 }),
          },
          {
            anchor: expect.objectContaining({ line: 7, ch: 26 }),
            head: expect.objectContaining({ line: 7, ch: 26 }),
          },
        ]);
      });

      it('should copy selected lines down', () => {
        withMultipleSelections(editor as any, copyLine, {
          ...defaultMultipleSelectionOptions,
          args: 'down',
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem ipsum\ndolor sit\nlorem ipsum\ndolor sit\namet\namet\n\n` +
            `consectetur "adipiscing" 'elit'\nconsectetur "adipiscing" 'elit'\n` +
            `consectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 2, ch: 6 }),
            head: expect.objectContaining({ line: 3, ch: 5 }),
          },
          {
            anchor: expect.objectContaining({ line: 5, ch: 2 }),
            head: expect.objectContaining({ line: 5, ch: 2 }),
          },
          {
            anchor: expect.objectContaining({ line: 8, ch: 14 }),
            head: expect.objectContaining({ line: 8, ch: 17 }),
          },
          {
            anchor: expect.objectContaining({ line: 9, ch: 26 }),
            head: expect.objectContaining({ line: 9, ch: 26 }),
          },
        ]);
      });
    });

    describe('selectWord', () => {
      it('should select words', () => {
        withMultipleSelections(editor as any, selectWord);

        const { doc, selectedTextMultiple } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selectedTextMultiple).toEqual([
          'ipsum\ndolor',
          'amet',
          'dip',
          'elit',
        ]);
      });
    });

    describe('selectLine', () => {
      it('should select lines', () => {
        withMultipleSelections(editor as any, selectLine);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selectedText).toEqual(
          originalDoc + `\n\nconsectetur "adipiscing" 'elit'\n`,
        );
      });
    });

    describe('goToLineBoundary', () => {
      it('should go to line starts', () => {
        withMultipleSelections(editor as any, goToLineBoundary, {
          ...defaultMultipleSelectionOptions,
          args: 'start',
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 0 }),
            head: expect.objectContaining({ line: 0, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 2, ch: 0 }),
            head: expect.objectContaining({ line: 2, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 0 }),
            head: expect.objectContaining({ line: 4, ch: 0 }),
          },
        ]);
      });

      it('should go to line ends', () => {
        withMultipleSelections(editor as any, goToLineBoundary, {
          ...defaultMultipleSelectionOptions,
          args: 'end',
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 1, ch: 9 }),
            head: expect.objectContaining({ line: 1, ch: 9 }),
          },
          {
            anchor: expect.objectContaining({ line: 2, ch: 4 }),
            head: expect.objectContaining({ line: 2, ch: 4 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 31 }),
            head: expect.objectContaining({ line: 4, ch: 31 }),
          },
        ]);
      });
    });

    describe('navigateLine', () => {
      it('should navigate to the previous lines', () => {
        withMultipleSelections(editor as any, navigateLine, {
          ...defaultMultipleSelectionOptions,
          args: 'up',
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 6 }),
            head: expect.objectContaining({ line: 0, ch: 6 }),
          },
          {
            anchor: expect.objectContaining({ line: 1, ch: 2 }),
            head: expect.objectContaining({ line: 1, ch: 2 }),
          },
          {
            anchor: expect.objectContaining({ line: 3, ch: 0 }),
            head: expect.objectContaining({ line: 3, ch: 0 }),
          },
        ]);
      });

      it('should navigate to the next lines', () => {
        withMultipleSelections(editor as any, navigateLine, {
          ...defaultMultipleSelectionOptions,
          args: 'down',
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 1, ch: 6 }),
            head: expect.objectContaining({ line: 1, ch: 6 }),
          },
          {
            anchor: expect.objectContaining({ line: 3, ch: 0 }),
            head: expect.objectContaining({ line: 3, ch: 0 }),
          },
          {
            anchor: expect.objectContaining({ line: 5, ch: 16 }),
            head: expect.objectContaining({ line: 5, ch: 16 }),
          },
        ]);
      });
    });

    describe('moveCursor', () => {
      it('should navigate cursors backward', () => {
        withMultipleSelections(editor as any, moveCursor, {
          ...defaultMultipleSelectionOptions,
          args: DIRECTION.BACKWARD,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 5 }),
            head: expect.objectContaining({ line: 0, ch: 5 }),
          },
          {
            anchor: expect.objectContaining({ line: 2, ch: 1 }),
            head: expect.objectContaining({ line: 2, ch: 1 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 16 }),
            head: expect.objectContaining({ line: 4, ch: 16 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 25 }),
            head: expect.objectContaining({ line: 4, ch: 25 }),
          },
        ]);
      });

      it('should navigate cursors forward', () => {
        withMultipleSelections(editor as any, moveCursor, {
          ...defaultMultipleSelectionOptions,
          args: DIRECTION.FORWARD,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({ line: 0, ch: 7 }),
            head: expect.objectContaining({ line: 0, ch: 7 }),
          },
          {
            anchor: expect.objectContaining({ line: 2, ch: 3 }),
            head: expect.objectContaining({ line: 2, ch: 3 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 18 }),
            head: expect.objectContaining({ line: 4, ch: 18 }),
          },
          {
            anchor: expect.objectContaining({ line: 4, ch: 27 }),
            head: expect.objectContaining({ line: 4, ch: 27 }),
          },
        ]);
      });
    });

    describe('transformCase', () => {
      it('should transform to uppercase', () => {
        withMultipleSelections(editor as any, transformCase, {
          ...defaultMultipleSelectionOptions,
          args: CASE.UPPER,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem IPSUM\nDOLOR sit\nAMET\n\nconsectetur ` +
            `"aDIPiscing" 'ELIT'\n(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual(originalSelectionRanges);
      });

      it('should transform to lowercase', () => {
        withMultipleSelections(editor as any, transformCase, {
          ...defaultMultipleSelectionOptions,
          args: CASE.LOWER,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem ipsum\ndolor sit\namet\n\nconsectetur ` +
            `"adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual(originalSelectionRanges);
      });

      it('should transform to title case', () => {
        withMultipleSelections(editor as any, transformCase, {
          ...defaultMultipleSelectionOptions,
          args: CASE.TITLE,
        });

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(
          `lorem Ipsum\nDolor sit\nAmet\n\nconsectetur ` +
            `"aDipiscing" 'Elit'\n(donec [mattis])\ntincidunt metus`,
        );
        expect(selections).toEqual(originalSelectionRanges);
      });
    });

    describe('expandSelectionToBrackets', () => {
      it('should expand selections to brackets', () => {
        editor.setSelections([
          ...editor.listSelections(),
          { anchor: { line: 5, ch: 6 }, head: { line: 5, ch: 6 } }, // (donec{<>}
        ]);

        withMultipleSelections(editor as any, expandSelectionToBrackets);

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          ...originalSelectionRanges,
          {
            anchor: expect.objectContaining({
              line: 5,
              ch: 1,
            }),
            head: expect.objectContaining({
              line: 5,
              ch: 15,
            }),
          },
        ]);
      });
    });

    describe('expandSelectionToQuotes', () => {
      it('should expand selections to quotes', () => {
        withMultipleSelections(editor as any, expandSelectionToQuotes);

        const { doc, selections } = getDocumentAndSelection(editor);
        expect(doc).toEqual(extendedDoc);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({
              line: 1,
              ch: 5,
            }),
            head: expect.objectContaining({
              line: 0,
              ch: 6,
            }),
          },
          {
            anchor: expect.objectContaining({
              line: 2,
              ch: 2,
            }),
            head: expect.objectContaining({
              line: 2,
              ch: 2,
            }),
          },
          {
            anchor: expect.objectContaining({
              line: 4,
              ch: 13,
            }),
            head: expect.objectContaining({
              line: 4,
              ch: 23,
            }),
          },
          {
            anchor: expect.objectContaining({
              line: 4,
              ch: 26,
            }),
            head: expect.objectContaining({
              line: 4,
              ch: 30,
            }),
          },
        ]);
      });
    });
  });
});
