import type { Editor } from 'codemirror';

export const getDocumentAndSelection = (editor: Editor) => {
  return {
    doc: editor.getValue(),
    cursor: editor.getCursor(),
    selectedText: editor.getSelection(),
    selectedTextMultiple: editor.getSelections(),
    selections: editor.listSelections(),
  };
};
