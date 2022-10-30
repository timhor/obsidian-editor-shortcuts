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

describe('Code Editor Shortcuts: actions - multiple mixed selections', () => {
  let view: EditorViewWithLegacyMethods;
  let initialSelections: SelectionRange[];

  const originalDoc =
    `lorem ipsum\ndolor sit\namet\n\n` +
    `consectetur "adipiscing" 'elit'\n(donec [mattis])\ntincidunt metus`;
  const originalSelectionRanges = [
    { anchor: { line: 1, ch: 5 }, head: { line: 0, ch: 6 } }, // {<}ipsum\ndolor{>}
    { anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 2 } }, // am{<>}et
    { anchor: { line: 4, ch: 14 }, head: { line: 4, ch: 17 } }, // a{<}dip{>}iscing
    { anchor: { line: 4, ch: 26 }, head: { line: 4, ch: 26 } }, // '{<>}elit
  ];
  const initialState = EditorState.create({
    doc: originalDoc,
  });

  beforeAll(() => {
    view = new EditorView({
      parent: document.body,
      state: initialState,
    });
    initialSelections = originalSelectionRanges.map((range) =>
      EditorSelection.range(
        posToOffset(view.state.doc, range.anchor),
        posToOffset(view.state.doc, range.head),
      ),
    );
    defineLegacyEditorMethods(view);
  });

  beforeEach(() => {
    view.setState(initialState);
    view.dispatch({ selection: EditorSelection.create(initialSelections) });
  });
});
