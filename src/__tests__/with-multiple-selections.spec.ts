import { EditorView } from '@codemirror/view';
import {
  defineLegacyEditorMethods,
  EditorViewWithLegacyMethods,
  getDocumentAndSelection,
} from './test-helpers';
import { withMultipleSelections } from '../utils';
import {
  deleteLine,
  deleteToStartOfLine,
  expandSelectionToQuotes,
  transformCase,
} from '../actions';
import { CASE } from '../constants';

describe('Code Editor Shortcuts: utils - withMultipleSelections', () => {
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
  });

  it('uses setSelections (not an empty transaction) when no changes are produced', () => {
    view.setSelections([
      { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
      { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 0 } },
    ]);

    withMultipleSelections(view as any, (editor, selection) => ({
      changes: [],
      newSelection: {
        from: selection.head,
        to: { line: selection.head.line, ch: 5 },
      },
    }));

    const { doc, selections } = getDocumentAndSelection(view as any);
    expect(doc).toEqual(originalDoc);
    expect(selections).toEqual([
      { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
      { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 5 } },
    ]);
  });

  it('merges identical duplicate ranges produced by multiple cursors on the same line', () => {
    view.setSelections([
      { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
      { anchor: { line: 0, ch: 3 }, head: { line: 0, ch: 3 } },
    ]);

    withMultipleSelections(view as any, () => ({
      changes: [
        { from: { line: 0, ch: 0 }, to: { line: 0, ch: 5 }, text: 'XXXXX' },
      ],
      newSelection: { from: { line: 0, ch: 5 } },
    }));

    const { doc } = getDocumentAndSelection(view as any);
    expect(doc).toEqual('XXXXX ipsum\ndolor sit\namet');
  });

  it('does not merge same-position zero-width inserts (they should stack)', () => {
    view.setSelections([
      { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
      { anchor: { line: 0, ch: 3 }, head: { line: 0, ch: 3 } },
    ]);

    withMultipleSelections(view as any, () => ({
      changes: [{ from: { line: 0, ch: 0 }, text: 'X' }],
      newSelection: { from: { line: 0, ch: 0 } },
    }));

    const { doc } = getDocumentAndSelection(view as any);
    // Both cursors contributed the same insert at the same position - both
    // should apply, stacking the inserted text twice.
    expect(doc).toEqual('XXlorem ipsum\ndolor sit\namet');
  });

  it('merges overlapping change ranges into their union instead of throwing', () => {
    view.setSelections([
      { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
      { anchor: { line: 0, ch: 3 }, head: { line: 0, ch: 3 } },
    ]);

    let call = 0;
    expect(() =>
      withMultipleSelections(view as any, () => {
        call++;
        const changes =
          call === 1
            ? [{ from: { line: 0, ch: 0 }, to: { line: 0, ch: 5 }, text: '' }]
            : [{ from: { line: 0, ch: 2 }, to: { line: 0, ch: 8 }, text: '' }];
        return { changes, newSelection: { from: { line: 0, ch: 0 } } };
      }),
    ).not.toThrow();

    const { doc } = getDocumentAndSelection(view as any);
    // Union of [0,5) and [2,8) is [0,8) removed from 'lorem ipsum...'
    expect(doc).toEqual('sum\ndolor sit\namet');
  });

  it('preserves a reversed selection through the selection-only path', () => {
    // No quotes in the document, so expandSelectionToQuotes returns the
    // original (reversed) selection unchanged
    view.setSelections([
      { anchor: { line: 1, ch: 5 }, head: { line: 0, ch: 6 } },
    ]);

    withMultipleSelections(view as any, expandSelectionToQuotes);

    const { doc, selections } = getDocumentAndSelection(view as any);
    expect(doc).toEqual(originalDoc);
    expect(selections).toEqual([
      { anchor: { line: 1, ch: 5 }, head: { line: 0, ch: 6 } },
    ]);
  });

  it('accounts for earlier same-command deletions when merging a line up (deleteToStartOfLine)', () => {
    // First cursor deletes 6 chars from the start of line 0; second cursor
    // at the start of line 1 deletes the preceding newline and must land at
    // the end of the truncated line 0
    view.setSelections([
      { anchor: { line: 0, ch: 6 }, head: { line: 0, ch: 6 } },
      { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 0 } },
    ]);

    withMultipleSelections(view as any, deleteToStartOfLine);

    const { doc, selections } = getDocumentAndSelection(view as any);
    expect(doc).toEqual('ipsumdolor sit\namet');
    expect(selections).toEqual([
      { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
      { anchor: { line: 0, ch: 5 }, head: { line: 0, ch: 5 } },
    ]);
  });

  it('applies toggleCase once when two cursors are inside the same word', () => {
    // Legacy behavior applied the transform per cursor sequentially (the
    // second toggle undoing the first); identical overlapping changes are
    // now merged so the transform applies exactly once
    view.setSelections([
      { anchor: { line: 0, ch: 7 }, head: { line: 0, ch: 7 } },
      { anchor: { line: 0, ch: 9 }, head: { line: 0, ch: 9 } },
    ]);

    withMultipleSelections(view as any, transformCase, {
      args: { caseType: CASE.NEXT },
    });

    const { doc } = getDocumentAndSelection(view as any);
    expect(doc).toEqual('lorem Ipsum\ndolor sit\namet');
  });

  it('undoes a multi-cursor command in a single undo step', () => {
    view.setSelections([
      { anchor: { line: 0, ch: 2 }, head: { line: 0, ch: 2 } },
      { anchor: { line: 1, ch: 2 }, head: { line: 1, ch: 2 } },
    ]);

    withMultipleSelections(view as any, deleteLine, {
      combineSameLineSelections: true,
    });

    expect(view.getValue()).toEqual('amet');

    view.undo();

    const { doc } = getDocumentAndSelection(view as any);
    expect(doc).toEqual(originalDoc);
  });
});
