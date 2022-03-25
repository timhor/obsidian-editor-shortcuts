import { EditorSelectionOrCaret } from 'obsidian';

export type CustomSelectionHandler = (
  selections: EditorSelectionOrCaret[],
) => EditorSelectionOrCaret[];
