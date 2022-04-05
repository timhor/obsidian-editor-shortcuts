import CodeMirror from 'codemirror';
import type { Editor, Range } from 'codemirror';
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

describe('Code Editor Shortcuts: actions - multiple mixed selections', () => {
  let editor: Editor;
  const originalDoc =
    `lorem ipsum\ndolor sit\namet\n\n` +
    `consectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`;

  beforeAll(() => {
    editor = CodeMirror(document.body);
    // To make cm.operation() work, since editor here already refers to the
    // CodeMirror object
    (editor as any).cm = editor;
  });

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
    editor.setValue(originalDoc);
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
      expect(doc).toEqual(
        `\nlorem ipsum\ndolor sit\n\namet\n\n\n\n` +
          `consectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`,
      );
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual(
        `lorem ipsum\ndolor sit\namet\n\nconsectetur "adipiscing" 'elit'\n`,
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
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
      expect(doc).toEqual(originalDoc);
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

  describe('undo: sanity check', () => {
    it('should group changes as a single transaction', () => {
      let doc: string;
      let selections: any;
      const expectedDoc =
        `\nlorem ipsum\ndolor sit\n\namet\n\n\n\n` +
        `consectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`;
      const expectedSelectionRanges = [
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
      ];

      withMultipleSelections(editor as any, insertLineAbove);

      ({ doc, selections } = getDocumentAndSelection(editor));
      expect(doc).toEqual(expectedDoc);
      expect(selections).toEqual(expectedSelectionRanges);

      editor.undo();

      ({ doc, selections } = getDocumentAndSelection(editor));
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual(originalSelectionRanges);
    });
  });
});
