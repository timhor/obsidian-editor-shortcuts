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

describe('Code Editor Shortcuts: actions - single range selection', () => {
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
    initialSelection = EditorSelection.range(
      posToOffset(view.state.doc, { line: 0, ch: 6 }),
      posToOffset(view.state.doc, { line: 1, ch: 5 }),
    );
    defineLegacyEditorMethods(view);
  });

  beforeEach(() => {
    view.setState(initialState);
    view.dispatch({ selection: EditorSelection.create([initialSelection]) });
  });
});
