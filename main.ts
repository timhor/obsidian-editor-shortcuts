import { MarkdownView, Plugin } from 'obsidian';
import { insertLineAbove, insertLineBelow } from './actions';

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
  }

  onunload() {
    console.log('Unloading plugin: CodeEditorShortcuts');
  }
}
