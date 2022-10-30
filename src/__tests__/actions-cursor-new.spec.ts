import {
  EditorSelection,
  EditorState,
  SelectionRange,
} from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  defineLegacyEditorMethods,
  EditorViewWithLegacyMethods,
  getDocumentAndSelection,
  posToOffset,
} from './test-helpers';
import { insertLineAbove } from '../actions';
import { withMultipleSelectionsNew } from '../utils';
import { SettingsState } from '../state';

describe('Code Editor Shortcuts: actions - single cursor selection', () => {
  let view: EditorViewWithLegacyMethods;
  let initialSelection: SelectionRange;

  const originalDoc = 'lorem ipsum\ndolor sit\namet';
  const initialState = EditorState.create({
    doc: originalDoc,
  });

  beforeAll(() => {
    view = new EditorView({
      parent: document.body,
      state: initialState,
    });
    initialSelection = EditorSelection.cursor(
      posToOffset(view.state.doc, { line: 1, ch: 0 }),
    );
    defineLegacyEditorMethods(view);
  });

  beforeEach(() => {
    view.setState(initialState);
    view.dispatch({ selection: EditorSelection.create([initialSelection]) });
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
        view.setState(EditorState.create({ doc: '- aaa\n- bbb' }));
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view);
        expect(doc).toEqual('- aaa\n\n- bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 0,
          }),
        );
      });

      it('should not insert a prefix when at the first list item', () => {
        view.setState(EditorState.create({ doc: '- aaa\n- bbb' }));
        view.setCursor({ line: 0, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view);
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
        view.setState(EditorState.create({ doc: content }));
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view);
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
          view.setState(EditorState.create({ doc: content }));
          view.setCursor({ line: 1, ch: 7 });

          withMultipleSelectionsNew(view as any, insertLineAbove);

          const { doc, cursor } = getDocumentAndSelection(view);
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
        view.setState(EditorState.create({ doc: '- aaa\n  - bbb' }));
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view);
        expect(doc).toEqual('- aaa\n  - \n  - bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 4,
          }),
        );
      });

      it('should insert number prefix', () => {
        view.setState(EditorState.create({ doc: '1. aaa\n2. bbb' }));
        view.setCursor({ line: 1, ch: 4 });

        withMultipleSelectionsNew(view as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(view);
        expect(doc).toEqual('1. aaa\n2. \n3. bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 3,
          }),
        );
      });

      // TODO: Implement once migrated to CM6
      it.todo('should format the remaining number prefixes');
    });
  });
});
