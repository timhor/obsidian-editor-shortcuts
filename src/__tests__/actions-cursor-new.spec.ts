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
});
