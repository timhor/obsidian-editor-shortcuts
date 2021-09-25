import { MarkdownView, Plugin } from 'obsidian';
import {
  insertLineAbove,
  insertLineBelow,
  deleteLine,
  joinLines,
  duplicateLine,
} from './actions';

export default class CodeEditorShortcuts extends Plugin {
  async onload() {
    console.log('Loading plugin: CodeEditorShortcuts');

    this.addCommand({
      id: 'insertLineAbove',
      name: 'Insert line above',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'Enter',
        },
      ],
      callback: () => {
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView).editor;
        if (!editor.hasFocus()) {
          console.log('No-op: editor not in focus');
          return;
        }
        insertLineAbove(editor);
      },
    });

    this.addCommand({
      id: 'insertLineBelow',
      name: 'Insert line below',
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'Enter',
        },
      ],
      callback: () => {
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView).editor;
        if (!editor.hasFocus()) {
          console.log('No-op: editor not in focus');
          return;
        }
        insertLineBelow(editor);
      },
    });

    this.addCommand({
      id: 'deleteLine',
      name: 'Delete line',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'K',
        },
        {
          modifiers: ['Ctrl', 'Shift'],
          key: 'K',
        },
      ],
      callback: () => {
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView).editor;
        if (!editor.hasFocus()) {
          console.log('No-op: editor not in focus');
          return;
        }
        deleteLine(editor);
      },
    });

    this.addCommand({
      id: 'joinLines',
      name: 'Join lines',
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'J',
        },
      ],
      callback: () => {
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView).editor;
        if (!editor.hasFocus()) {
          console.log('No-op: editor not in focus');
          return;
        }
        joinLines(editor);
      },
    });

    this.addCommand({
      id: 'duplicateLine',
      name: 'Duplicate line',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'D',
        },
      ],
      callback: () => {
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView).editor;
        if (!editor.hasFocus()) {
          console.log('No-op: editor not in focus');
          return;
        }
        duplicateLine(editor);
      },
    });
  }

  onunload() {
    console.log('Unloading plugin: CodeEditorShortcuts');
  }
}
