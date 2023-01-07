import { EditorView } from '@codemirror/view';
import {
  defineLegacyEditorMethods,
  EditorViewWithLegacyMethods,
  getDocumentAndSelection,
} from './test-helpers';
import { insertLineAbove, insertLineBelow, deleteLine } from '../actions';
import { withMultipleSelectionsNew } from '../utils';
import { SettingsState } from '../state';

describe('Code Editor Shortcuts: actions - single range selection', () => {
  let view: EditorViewWithLegacyMethods;

  const originalDoc = 'lorem ipsum\ndolor sit\namet';

  beforeAll(() => {
    view = new EditorView({
      parent: document.body,
    });

    defineLegacyEditorMethods(view);
  });

  beforeEach(() => {
    SettingsState.autoInsertListPrefix = true;
    view.setValue(originalDoc);
    view.setSelection({ line: 0, ch: 6 }, { line: 1, ch: 5 });
  });

  describe('insertLineAbove', () => {
    it('should insert line above', () => {
      withMultipleSelectionsNew(view as any, insertLineAbove);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('lorem ipsum\n\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
    });
  });

  describe('insertLineBelow', () => {
    it('should insert line below', () => {
      withMultipleSelectionsNew(view as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('lorem ipsum\ndolor sit\n\namet');
      expect(cursor.line).toEqual(2);
    });

    it('should insert prefix when inside a list', () => {
      view.setValue('- aaa\n- bbb');
      view.setSelection({ line: 0, ch: 2 }, { line: 0, ch: 5 });

      withMultipleSelectionsNew(view as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('- aaa\n- \n- bbb');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 1,
          ch: 2,
        }),
      );
    });
  });

  describe('deleteLine', () => {
    it('should delete selected lines', () => {
      withMultipleSelectionsNew(view as any, deleteLine);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('amet');
      expect(cursor.line).toEqual(0);
    });
  });
});
