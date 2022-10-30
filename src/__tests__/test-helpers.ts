import { EditorSelection, Text } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { Editor } from 'codemirror';
import type {
  EditorPosition,
  EditorSelection as ObsidianEditorSelection,
  EditorTransaction,
} from 'obsidian';

export const getDocumentAndSelection = (editor: Editor) => {
  return {
    doc: editor.getValue(),
    cursor: editor.getCursor(),
    selectedText: editor.getSelection(),
    selectedTextMultiple: editor.getSelections(),
    selections: editor.listSelections(),
  };
};

export interface EditorViewWithLegacyMethods extends EditorView {
  getValue?: () => string;
  getCursor?: () => EditorPosition;
  setCursor?: (pos: EditorPosition) => void;
  getSelection?: () => string;
  getSelections?: () => string[];
  listSelections?: () => ObsidianEditorSelection[];
  transaction?: (tx: EditorTransaction) => void;
}

export const posToOffset = (doc: Text, pos: EditorPosition) => {
  if (!pos) {
    return null;
  }
  return doc.line(pos.line + 1).from + pos.ch;
};

export const offsetToPos = (doc: Text, offset: number) => {
  const line = doc.lineAt(offset);
  return { line: line.number - 1, ch: offset - line.from };
};

/**
 * Defines legacy methods on an EditorView instance
 *
 * @see https://codemirror.net/docs/migration/
 */
export const defineLegacyEditorMethods = (
  view: EditorViewWithLegacyMethods,
) => {
  view.getValue = () => view.state.doc.toString();

  view.getCursor = () =>
    offsetToPos(view.state.doc, view.state.selection.main.head);

  view.setCursor = (pos) =>
    view.dispatch({
      selection: { anchor: posToOffset(view.state.doc, pos) },
    });

  view.getSelection = () =>
    view.state.sliceDoc(
      view.state.selection.main.from,
      view.state.selection.main.to,
    );

  view.getSelections = () =>
    view.state.selection.ranges.map((r) => view.state.sliceDoc(r.from, r.to));

  view.listSelections = () =>
    view.state.selection.ranges.map((range) => ({
      anchor: offsetToPos(view.state.doc, range.anchor),
      head: offsetToPos(view.state.doc, range.head ? range.head : range.anchor),
    }));

  view.transaction = (tx) => {
    const changes = tx.changes.map((change) => ({
      from: posToOffset(view.state.doc, change.from),
      // Spread to only assign 'to' if it exists: https://stackoverflow.com/a/60492828
      ...(change.to && { to: posToOffset(view.state.doc, change.to) }),
      insert: change.text,
    }));
    view.dispatch({
      changes,
    });

    // Dispatch selections separately as they depend on the updated document
    const selections = tx.selections.map((selection) => {
      const fromOffset = posToOffset(view.state.doc, selection.from);
      const toOffset = posToOffset(
        view.state.doc,
        selection.to ? selection.to : selection.from,
      );
      return EditorSelection.range(fromOffset, toOffset);
    });
    view.dispatch({
      selection: EditorSelection.create(selections),
    });
  };
};
