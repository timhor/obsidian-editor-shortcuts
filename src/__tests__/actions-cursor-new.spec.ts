import { EditorView } from '@codemirror/view';
import {
  defineLegacyEditorMethods,
  EditorViewWithLegacyMethods,
  getDocumentAndSelection,
} from './test-helpers';
import { insertLineAbove, insertLineBelow, deleteLine } from '../actions';
import { withMultipleSelectionsNew } from '../utils';
import { SettingsState } from '../state';

describe('Code Editor Shortcuts: actions - single cursor selection', () => {
  let view: EditorViewWithLegacyMethods;

  const originalDoc = 'lorem ipsum\ndolor sit\namet';

  beforeAll(() => {
    view = new EditorView({
      parent: document.body,
    });
    defineLegacyEditorMethods(view);
  });

  beforeEach(() => {
    view.setValue(originalDoc);
    view.setCursor({ line: 1, ch: 0 });
  });

  describe('insertLineAbove', () => {
    it('should insert line above', () => {
      withMultipleSelectionsNew(view as any, insertLineAbove);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('lorem ipsum\n\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
    });

    it('should insert line above first line', () => {
      view.setCursor({ line: 0, ch: 0 });

      withMultipleSelectionsNew(view as any, insertLineAbove);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('\nlorem ipsum\ndolor sit\namet');
      expect(cursor.line).toEqual(0);
    });

    describe('when inside a list', () => {
      afterEach(() => {
        SettingsState.autoInsertListPrefix = true;
      });

      it('should not insert a prefix when setting is disabled', () => {
        SettingsState.autoInsertListPrefix = false;
        view.setValue('- aaa\n- bbb');
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('- aaa\n\n- bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 0,
          }),
        );
      });

      it('should not insert a prefix when at the first list item', () => {
        view.setValue('- aaa\n- bbb');
        view.setCursor({ line: 0, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('\n- aaa\n- bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 0,
            ch: 0,
          }),
        );
      });

      it.each([
        ['-', '- aaa\n- bbb', '- aaa\n- \n- bbb'],
        ['*', '* aaa\n* bbb', '* aaa\n* \n* bbb'],
        ['+', '+ aaa\n+ bbb', '+ aaa\n+ \n+ bbb'],
        ['>', '> aaa\n> bbb', '> aaa\n> \n> bbb'],
      ])('should insert `%s` prefix', (_scenario, content, expectedDoc) => {
        view.setValue(content);
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual(expectedDoc);
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 2,
          }),
        );
      });

      it.each([
        ['- [ ]', '- [ ] aaa\n- [ ] bbb', '- [ ] aaa\n- [ ] \n- [ ] bbb'],
        ['- [x]', '- [x] aaa\n- [x] bbb', '- [x] aaa\n- [ ] \n- [x] bbb'],
      ])(
        'should insert empty checkbox for `%s` prefix',
        (_scenario, content, expectedDoc) => {
          view.setValue(content);
          view.setCursor({ line: 1, ch: 7 });

          withMultipleSelectionsNew(view as any, insertLineAbove);

          const { doc, cursor } = getDocumentAndSelection(view as any);
          expect(doc).toEqual(expectedDoc);
          expect(cursor).toEqual(
            expect.objectContaining({
              line: 1,
              ch: 6,
            }),
          );
        },
      );

      it('should insert list prefix at the correct indentation', () => {
        view.setValue('- aaa\n  - bbb');
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('- aaa\n  - \n  - bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 4,
          }),
        );
      });

      it('should insert number prefix and format the remaining number prefixes', () => {
        view.setValue('1. aaa\n2. bbb');
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('1. aaa\n2. \n3. bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 3,
          }),
        );
      });
    });
  });

  describe('insertLineBelow', () => {
    it('should insert line below', () => {
      withMultipleSelectionsNew(view as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('lorem ipsum\ndolor sit\n\namet');
      expect(cursor.line).toEqual(2);
    });

    it('should insert line below with the same indentation level', () => {
      view.setValue('    lorem ipsum\n    dolor sit\n    amet');
      view.setCursor({ line: 1, ch: 0 });

      withMultipleSelectionsNew(view as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('    lorem ipsum\n    dolor sit\n    \n    amet');
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });

    it('should insert line below last line', () => {
      view.setCursor({ line: 2, ch: 0 });

      withMultipleSelectionsNew(view as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('lorem ipsum\ndolor sit\namet\n');
      expect(cursor.line).toEqual(3);
    });

    describe('when inside a list', () => {
      afterEach(() => {
        SettingsState.autoInsertListPrefix = true;
      });

      it('should not insert a prefix when setting is disabled', () => {
        SettingsState.autoInsertListPrefix = false;
        view.setValue('- aaa\n- bbb');
        view.setCursor({ line: 0, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('- aaa\n\n- bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 0,
          }),
        );
      });

      it.each([
        ['-', '- aaa\n- bbb', '- aaa\n- \n- bbb'],
        ['*', '* aaa\n* bbb', '* aaa\n* \n* bbb'],
        ['+', '+ aaa\n+ bbb', '+ aaa\n+ \n+ bbb'],
        ['>', '> aaa\n> bbb', '> aaa\n> \n> bbb'],
      ])('should insert `%s` prefix', (_scenario, content, expectedDoc) => {
        view.setValue(content);
        view.setCursor({ line: 0, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual(expectedDoc);
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 2,
          }),
        );
      });

      it.each([
        ['- [ ]', '- [ ] aaa\n- [ ] bbb', '- [ ] aaa\n- [ ] \n- [ ] bbb'],
        ['- [x]', '- [x] aaa\n- [x] bbb', '- [x] aaa\n- [ ] \n- [x] bbb'],
      ])(
        'should insert empty checkbox for `%s` prefix',
        (_scenario, content, expectedDoc) => {
          view.setValue(content);
          view.setCursor({ line: 0, ch: 7 });

          withMultipleSelectionsNew(view as any, insertLineBelow);

          const { doc, cursor } = getDocumentAndSelection(view as any);
          expect(doc).toEqual(expectedDoc);
          expect(cursor).toEqual(
            expect.objectContaining({
              line: 1,
              ch: 6,
            }),
          );
        },
      );

      it('should insert list prefix at the correct indentation', () => {
        view.setValue('- aaa\n  - bbb');
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('- aaa\n  - bbb\n  - ');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 2,
            ch: 4,
          }),
        );
      });

      it('should insert number prefix and format the remaining number prefixes', () => {
        view.setValue('1. aaa\n2. bbb');
        view.setCursor({ line: 0, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('1. aaa\n2. \n3. bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 3,
          }),
        );
      });

      it('should delete line contents if list item is empty', () => {
        view.setValue('- aaa\n  - ');
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(view as any);
        expect(doc).toEqual('- aaa\n');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 0,
          }),
        );
      });
    });
  });

  describe('deleteLine', () => {
    it('should delete line at cursor', () => {
      withMultipleSelectionsNew(view as any, deleteLine);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('lorem ipsum\namet');
      expect(cursor.line).toEqual(1);
    });

    it('should delete last line', () => {
      view.setCursor({ line: 2, ch: 2 });

      withMultipleSelectionsNew(view as any, deleteLine);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('lorem ipsum\ndolor sit');
      expect(cursor).toMatchObject({
        line: 1,
        ch: 2,
      });
    });

    it('should move cursor to correct position when deleting a line that is longer than the following line', () => {
      view.setValue(
        'testing with a line that is longer than the following line\nshorter line',
      );
      view.setCursor({ line: 0, ch: 53 });

      withMultipleSelectionsNew(view as any, deleteLine);

      const { doc, cursor } = getDocumentAndSelection(view as any);
      expect(doc).toEqual('shorter line');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 0,
          ch: 12,
        }),
      );
    });
  });
});
