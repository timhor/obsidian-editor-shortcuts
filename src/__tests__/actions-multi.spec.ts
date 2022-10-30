import CodeMirror from 'codemirror';
import type { Editor } from 'codemirror';
import { getDocumentAndSelection } from './test-helpers';
import {
  insertLineAbove,
  insertLineBelow,
  deleteLine,
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
  insertCursorAbove,
  insertCursorBelow,
} from '../actions';
import { CASE, CODE_EDITOR } from '../constants';
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

    // Assign the CodeMirror equivalents of posToOffset and offsetToPos
    (editor as any).posToOffset = editor.indexFromPos;
    (editor as any).offsetToPos = editor.posFromIndex;
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

    it('should insert prefixes when inside a list', () => {
      editor.setValue('- aaa\n  - bbb');
      editor.setSelections([
        { anchor: { line: 0, ch: 2 }, head: { line: 0, ch: 2 } },
        { anchor: { line: 1, ch: 6 }, head: { line: 1, ch: 6 } },
      ]);

      withMultipleSelections(editor as any, insertLineBelow);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('- aaa\n- \n  - bbb\n  - ');
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 1, ch: 2 }),
          head: expect.objectContaining({ line: 1, ch: 2 }),
        },
        {
          anchor: expect.objectContaining({ line: 3, ch: 4 }),
          head: expect.objectContaining({ line: 3, ch: 4 }),
        },
      ]);
    });
  });

  describe('deleteSelectedLines', () => {
    it('should delete selected lines', () => {
      withMultipleSelections(editor as any, deleteLine);

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

  describe('deleteToStartOfLine', () => {
    it('should delete to the start of the lines', () => {
      withMultipleSelections(editor as any, deleteToStartOfLine);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(
        `ipsum\ndolor sit\net\n\n` + `elit'\n(donec [mattis])\ntincidunt metus`,
      );
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
          anchor: expect.objectContaining({ line: 0, ch: 6 }),
          head: expect.objectContaining({ line: 0, ch: 6 }),
        },
        {
          anchor: expect.objectContaining({ line: 2, ch: 2 }),
          head: expect.objectContaining({ line: 2, ch: 2 }),
        },
        {
          anchor: expect.objectContaining({ line: 4, ch: 17 }),
          head: expect.objectContaining({ line: 4, ch: 17 }),
        },
      ]);
    });
  });

  describe('joinLines', () => {
    it('should join multiple selected lines', () => {
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
          anchor: expect.objectContaining({ line: 0, ch: 6 }),
          head: expect.objectContaining({ line: 0, ch: 17 }),
        },
        {
          anchor: expect.objectContaining({ line: 1, ch: 4 }),
          head: expect.objectContaining({ line: 1, ch: 4 }),
        },
        {
          anchor: expect.objectContaining({ line: 2, ch: 14 }),
          head: expect.objectContaining({ line: 2, ch: 17 }),
        },
      ]);
    });

    it('should not join the next line after the end of the document', () => {
      editor.setSelections([
        ...editor.listSelections(),
        { anchor: { line: 6, ch: 6 }, head: { line: 6, ch: 6 } }, // tincid{<>}unt
      ]);

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
          anchor: expect.objectContaining({ line: 0, ch: 6 }),
          head: expect.objectContaining({ line: 0, ch: 17 }),
        },
        {
          anchor: expect.objectContaining({ line: 1, ch: 4 }),
          head: expect.objectContaining({ line: 1, ch: 4 }),
        },
        {
          anchor: expect.objectContaining({ line: 2, ch: 14 }),
          head: expect.objectContaining({ line: 2, ch: 17 }),
        },
        {
          anchor: expect.objectContaining({ line: 3, ch: 15 }),
          head: expect.objectContaining({ line: 3, ch: 15 }),
        },
      ]);
    });

    it('should remove markdown list characters', () => {
      const content = '- aaa\n- bbb\n- ccc\n- ddd';
      editor.setValue(content);
      editor.setSelections([
        { anchor: { line: 0, ch: 3 }, head: { line: 0, ch: 3 } },
        { anchor: { line: 2, ch: 4 }, head: { line: 2, ch: 4 } },
      ]);

      withMultipleSelections(editor as any, joinLines);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('- aaa bbb\n- ccc ddd');
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 5 }),
          head: expect.objectContaining({ line: 0, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 1, ch: 5 }),
          head: expect.objectContaining({ line: 1, ch: 5 }),
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

  describe('selectWordOrNextOccurrence', () => {
    it('should select words', () => {
      selectWordOrNextOccurrence(editor as any);

      const { doc, selectedTextMultiple } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedTextMultiple).toEqual([
        'ipsum\ndolor',
        'amet',
        'dip',
        'elit',
      ]);
    });

    it('should not select next occurrence if multiple selection contents are not identical', () => {
      selectWordOrNextOccurrence(editor as any);
      selectWordOrNextOccurrence(editor as any);

      const { doc, selectedTextMultiple } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedTextMultiple).toEqual([
        'ipsum\ndolor',
        'amet',
        'dip',
        'elit',
      ]);
    });

    it('should select words containing unicode characters', () => {
      editor.setValue('café e açúcar');
      editor.setSelections([
        { anchor: { line: 0, ch: 2 }, head: { line: 0, ch: 2 } },
        { anchor: { line: 0, ch: 8 }, head: { line: 0, ch: 8 } },
      ]);

      selectWordOrNextOccurrence(editor as any);

      const { selectedTextMultiple } = getDocumentAndSelection(editor);
      expect(selectedTextMultiple[0]).toEqual('café');
      expect(selectedTextMultiple[1]).toEqual('açúcar');
    });
  });

  describe('selectAllOccurrences', () => {
    it('should not select all occurrences if multiple selection contents are not identical', () => {
      selectAllOccurrences(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual(originalSelectionRanges);
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

  describe('addCursorsToSelectionEnds', () => {
    it('should not add cursors to selection ends', () => {
      addCursorsToSelectionEnds(editor as any, CODE_EDITOR.VSCODE);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual(originalSelectionRanges);
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
        args: 'prev',
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
        args: 'next',
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

    it('should navigate to the first line', () => {
      withMultipleSelections(editor as any, navigateLine, {
        ...defaultMultipleSelectionOptions,
        args: 'first',
      });

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 0, ch: 0 }),
          head: expect.objectContaining({ line: 0, ch: 0 }),
        },
      ]);
    });

    it('should navigate to the last line', () => {
      withMultipleSelections(editor as any, navigateLine, {
        ...defaultMultipleSelectionOptions,
        args: 'last',
      });

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 6, ch: 15 }),
          head: expect.objectContaining({ line: 6, ch: 15 }),
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

    it('should cycle to next case', () => {
      withMultipleSelections(editor as any, transformCase, {
        ...defaultMultipleSelectionOptions,
        args: CASE.NEXT,
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

  describe.skip('undo: sanity check', () => {
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

      // @ts-expect-error - the new version of insertLineAbove is
      // incompatible with `withMultipleSelections`
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

  describe('expandSelectionToQuotesOrBrackets', () => {
    it.each([
      ['quotes', '("lorem ipsum" dolor)'],
      ['brackets', '"(lorem ipsum) dolor"'],
    ])(
      'should only expand the first selection to %s and leave the others untouched',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setSelections([
          { anchor: { line: 0, ch: 5 }, head: { line: 0, ch: 11 } },
          { anchor: { line: 0, ch: 18 }, head: { line: 0, ch: 18 } },
        ]);

        expandSelectionToQuotesOrBrackets(editor as any);

        const { doc, selections, selectedTextMultiple } =
          getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selections).toEqual([
          {
            anchor: expect.objectContaining({
              line: 0,
              ch: 2,
            }),
            head: expect.objectContaining({
              line: 0,
              ch: 13,
            }),
          },
          { anchor: { line: 0, ch: 18 }, head: { line: 0, ch: 18 } },
        ]);
        expect(selectedTextMultiple[0]).toEqual('lorem ipsum');
      },
    );
  });

  describe('insertCursorAbove', () => {
    it('should insert cursors above', () => {
      editor.setValue('aaaaa\nbbbbb\nccccc\nddddd');
      editor.setSelections([
        { anchor: { line: 1, ch: 1 }, head: { line: 1, ch: 3 } },
        { anchor: { line: 3, ch: 2 }, head: { line: 3, ch: 2 } },
      ]);

      insertCursorAbove(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('aaaaa\nbbbbb\nccccc\nddddd');
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 1 }, head: { line: 0, ch: 3 } },
        { anchor: { line: 1, ch: 1 }, head: { line: 1, ch: 3 } },
        { anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 2 } },
        { anchor: { line: 3, ch: 2 }, head: { line: 3, ch: 2 } },
      ]);
    });
  });

  describe('insertCursorBelow', () => {
    it('should insert cursors below', () => {
      editor.setValue('aaaaa\nbbbbb\nccccc\nddddd');
      editor.setSelections([
        { anchor: { line: 0, ch: 1 }, head: { line: 0, ch: 3 } },
        { anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 2 } },
      ]);

      insertCursorBelow(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('aaaaa\nbbbbb\nccccc\nddddd');
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 1 }, head: { line: 0, ch: 3 } },
        { anchor: { line: 1, ch: 1 }, head: { line: 1, ch: 3 } },
        { anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 2 } },
        { anchor: { line: 3, ch: 2 }, head: { line: 3, ch: 2 } },
      ]);
    });
  });
});
