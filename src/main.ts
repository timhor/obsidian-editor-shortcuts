import { Plugin } from 'obsidian';
import {
  copyLine,
  deleteSelectedLines,
  expandSelectionToBrackets,
  expandSelectionToQuotes,
  goToHeading,
  goToLineBoundary,
  insertLineAbove,
  insertLineBelow,
  joinLines,
  moveCursor,
  navigateLine,
  selectLine,
  selectWord,
  transformCase,
} from './actions';
import { CASE, DIRECTION } from './constants';

export default class CodeEditorShortcuts extends Plugin {
  onload() {
    this.addCommand({
      id: 'insertLineAbove',
      name: 'Insert line above',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'Enter',
        },
      ],
      editorCallback: (editor) => insertLineAbove(editor),
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
      editorCallback: (editor) => insertLineBelow(editor),
    });

    this.addCommand({
      id: 'deleteLine',
      name: 'Delete line',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'K',
        },
      ],
      editorCallback: (editor) => deleteSelectedLines(editor),
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
      editorCallback: (editor) => joinLines(editor),
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
      editorCallback: (editor) => copyLine(editor, 'down'),
    });

    this.addCommand({
      id: 'copyLineUp',
      name: 'Copy line up',
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowUp',
        },
      ],
      editorCallback: (editor) => copyLine(editor, 'up'),
    });

    this.addCommand({
      id: 'copyLineDown',
      name: 'Copy line down',
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowDown',
        },
      ],
      editorCallback: (editor) => copyLine(editor, 'down'),
    });

    this.addCommand({
      id: 'selectWord',
      name: 'Select word',
      editorCallback: (editor) => selectWord(editor),
    });

    this.addCommand({
      id: 'selectLine',
      name: 'Select line',
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'L',
        },
      ],
      editorCallback: (editor) => selectLine(editor),
    });

    this.addCommand({
      id: 'goToLineStart',
      name: 'Go to start of line',
      editorCallback: (editor) => goToLineBoundary(editor, 'start'),
    });

    this.addCommand({
      id: 'goToLineEnd',
      name: 'Go to end of line',
      editorCallback: (editor) => goToLineBoundary(editor, 'end'),
    });

    this.addCommand({
      id: 'goToNextLine',
      name: 'Go to next line',
      editorCallback: (editor) => navigateLine(editor, 'down'),
    });

    this.addCommand({
      id: 'goToPrevLine',
      name: 'Go to previous line',
      editorCallback: (editor) => navigateLine(editor, 'up'),
    });

    this.addCommand({
      id: 'goToNextChar',
      name: 'Move cursor forward',
      editorCallback: (editor) => moveCursor(editor, DIRECTION.FORWARD),
    });

    this.addCommand({
      id: 'goToPrevChar',
      name: 'Move cursor backward',
      editorCallback: (editor) => moveCursor(editor, DIRECTION.BACKWARD),
    });

    this.addCommand({
      id: 'transformToUppercase',
      name: 'Transform selection to uppercase',
      editorCallback: (editor) => transformCase(editor, CASE.UPPER),
    });

    this.addCommand({
      id: 'transformToLowercase',
      name: 'Transform selection to lowercase',
      editorCallback: (editor) => transformCase(editor, CASE.LOWER),
    });

    this.addCommand({
      id: 'transformToTitlecase',
      name: 'Transform selection to title case',
      editorCallback: (editor) => transformCase(editor, CASE.TITLE),
    });

    this.addCommand({
      id: 'expandSelectionToBrackets',
      name: 'Expand selection to brackets',
      editorCallback: (editor) => expandSelectionToBrackets(editor),
    });

    this.addCommand({
      id: 'expandSelectionToQuotes',
      name: 'Expand selection to quotes',
      editorCallback: (editor) => expandSelectionToQuotes(editor),
    });

    this.addCommand({
      id: 'goToNextHeading',
      name: 'Go to next heading',
      editorCallback: (editor) => goToHeading(this.app, editor, 'next'),
    });

    this.addCommand({
      id: 'goToPrevHeading',
      name: 'Go to previous heading',
      editorCallback: (editor) => goToHeading(this.app, editor, 'prev'),
    });
  }
}
