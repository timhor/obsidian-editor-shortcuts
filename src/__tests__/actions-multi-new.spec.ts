import { EditorView } from '@codemirror/view';
import {
  defineLegacyEditorMethods,
  EditorViewWithLegacyMethods,
  getDocumentAndSelection,
} from './test-helpers';
import { insertLineAbove, insertLineBelow, deleteLine } from '../actions';
import { withMultipleSelectionsNew } from '../utils';

describe('Code Editor Shortcuts: actions - multiple mixed selections', () => {
  let view: EditorViewWithLegacyMethods;

  const originalDoc =
    `lorem ipsum\ndolor sit\namet\n\n` +
    `consectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`;
  const originalSelectionRanges = [
    { anchor: { line: 1, ch: 5 }, head: { line: 0, ch: 6 } }, // {<}ipsum\ndolor{>}
    { anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 2 } }, // am{<>}et
    { anchor: { line: 4, ch: 14 }, head: { line: 4, ch: 17 } }, // a{<}dip{>}iscing
    { anchor: { line: 4, ch: 26 }, head: { line: 4, ch: 26 } }, // '{<>}elit
  ];

  beforeAll(() => {
    view = new EditorView({
      parent: document.body,
    });
    defineLegacyEditorMethods(view);
  });

  beforeEach(() => {
    view.setValue(originalDoc);
    view.setSelections(originalSelectionRanges);
  });

  describe('insertLineAbove', () => {
    it('should insert line above', () => {
      withMultipleSelectionsNew(view as any, insertLineAbove);

      const { doc, selections } = getDocumentAndSelection(view as any);
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
      withMultipleSelectionsNew(view as any, insertLineBelow);

      const { doc, selections } = getDocumentAndSelection(view as any);
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
      view.setValue('- aaa\n  - bbb');
      view.setSelections([
        { anchor: { line: 0, ch: 2 }, head: { line: 0, ch: 2 } },
        { anchor: { line: 1, ch: 6 }, head: { line: 1, ch: 6 } },
      ]);

      withMultipleSelectionsNew(view as any, insertLineBelow);

      const { doc, selections } = getDocumentAndSelection(view as any);
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

  describe('deleteLine', () => {
    it('should delete selected lines', () => {
      withMultipleSelectionsNew(view as any, deleteLine, {
        combineSameLineSelections: true,
      });

      const { doc, selections } = getDocumentAndSelection(view as any);
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
});
