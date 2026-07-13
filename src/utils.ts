import {
  App,
  Editor,
  EditorChange,
  EditorRangeOrCaret,
  EditorPosition,
  EditorSelection,
} from 'obsidian';
import {
  SEARCH_DIRECTION,
  LOWERCASE_ARTICLES,
  LIST_CHARACTER_REGEX,
} from './constants';

type EditorActionCallback = (
  editor: Editor,
  selection: EditorSelection,
  args: any,
) => { changes: EditorChange[]; newSelection: EditorRangeOrCaret };

export type EditorActionCallbackArgs = Record<string, any>;

type MultipleSelectionOptions = {
  // Additional information to be passed to the EditorActionCallback
  args?: EditorActionCallbackArgs;

  // Whether the action should be repeated for cursors on the same line
  repeatSameLineActions?: boolean;

  // Whether to combine cursors on the same line after the operation has
  // finished (the cursor with a smaller line number takes precedence)
  combineSameLineSelections?: boolean;
};

export const defaultMultipleSelectionOptions = { repeatSameLineActions: true };

const comparePositions = (a: EditorPosition, b: EditorPosition) =>
  a.line - b.line || a.ch - b.ch;

const isBefore = (a: EditorPosition, b: EditorPosition) =>
  comparePositions(a, b) < 0;

const isAfter = (a: EditorPosition, b: EditorPosition) =>
  comparePositions(a, b) > 0;

/**
 * Prepares a set of changes to be dispatched together in a single CM6
 * transaction. Under CM6, overlapping change ranges throw a
 * `RangeError: Overlapping changes` when passed to `EditorTransaction`, which
 * can happen when several cursors on the same line each contribute a
 * non-empty range (e.g. `deleteToStartOfLine`, `transformCase` deleting/
 * replacing overlapping spans). This merges overlapping/duplicate-range
 * deletions/replacements into the union of their ranges, so a single change
 * is applied covering the combined span.
 *
 * Zero-width changes (plain insertions, e.g. from `insertLineAbove`) are
 * intentionally left alone even when several land at the exact same
 * position - CM6 applies same-position insertions in order rather than
 * throwing, and legacy behavior relied on being able to stack them (e.g.
 * two cursors on the same line each inserting a blank line above).
 *
 * Changes are returned sorted by starting position (stable, so same-position
 * changes keep their original relative order), which is required by
 * `Editor.transaction`/CM6's changeset construction.
 */
const normalizeChanges = (changes: EditorChange[]): EditorChange[] => {
  const sorted = [...changes].sort((a, b) => comparePositions(a.from, b.from));
  const result: EditorChange[] = [];

  for (const change of sorted) {
    const to = change.to ?? change.from;
    const hasWidth = isBefore(change.from, to);
    const last = result[result.length - 1];

    if (last && hasWidth) {
      const lastTo = last.to ?? last.from;
      const lastHasWidth = isBefore(last.from, lastTo);
      const overlaps = lastHasWidth && isAfter(lastTo, change.from);

      if (overlaps) {
        // Merge into the union of the two ranges.
        const mergedFrom = isBefore(last.from, change.from)
          ? last.from
          : change.from;
        const mergedTo = isAfter(lastTo, to) ? lastTo : to;
        result[result.length - 1] = {
          from: mergedFrom,
          to: mergedTo,
          text: last.text || change.text,
        };
        continue;
      }
    }

    result.push(change);
  }

  return result;
};

export const withMultipleSelections = (
  editor: Editor,
  callback: EditorActionCallback,
  options: MultipleSelectionOptions = defaultMultipleSelectionOptions,
) => {
  const selections = editor.listSelections();
  let selectionIndexesToProcess: number[];
  const newSelections: EditorRangeOrCaret[] = [];
  const changes: EditorChange[] = [];

  if (!options.repeatSameLineActions) {
    const seenLines: number[] = [];
    selectionIndexesToProcess = selections.reduce(
      (indexes, currSelection, currIndex) => {
        const currentLine = currSelection.head.line;
        if (!seenLines.includes(currentLine)) {
          seenLines.push(currentLine);
          indexes.push(currIndex);
        }
        return indexes;
      },
      [],
    );
  }

  for (let i = 0; i < selections.length; i++) {
    // Controlled by repeatSameLineActions
    if (selectionIndexesToProcess && !selectionIndexesToProcess.includes(i)) {
      continue;
    }

    const { changes: newChanges, newSelection } = callback(
      editor,
      selections[i],
      {
        ...options.args,
        iteration: i,
      },
    );
    changes.push(...newChanges);

    if (options.combineSameLineSelections) {
      const existingSameLineSelection = newSelections.find(
        (selection) => selection.from.line === newSelection.from.line,
      );
      // Generally only happens when deleting consecutive lines using separate cursors
      if (existingSameLineSelection) {
        // Reset to 0 as `ch` will otherwise exceed the line length
        existingSameLineSelection.from.ch = 0;
        // Skip adding a new selection with the same line number
        continue;
      }
    }

    newSelections.push(newSelection);
  }

  if (changes.length === 0) {
    // Selection-only result (e.g. selectLine, goToLineBoundary,
    // navigateLine, expandSelection*): use setSelections directly rather
    // than dispatching an empty transaction, so undo history isn't
    // polluted with no-op steps. setSelections takes anchor/head (and can
    // therefore express a reversed/backwards selection), whereas the
    // from/to shape accumulated above is for editor.transaction's
    // `selections` option - convert between the two here.
    editor.setSelections(
      newSelections.map((selection) => ({
        anchor: selection.from,
        head: selection.to ?? selection.from,
      })),
    );
    return;
  }

  // `newSelection.from`/`to` map to anchor/head, so a callback can express a
  // reversed (backwards) selection by returning from > to. The transaction's
  // `selections` option cannot represent direction, so dispatch ordered
  // ranges and restore direction afterwards via setSelections (which does
  // not add an undo step).
  const hasReversedSelection = newSelections.some(
    (selection) =>
      selection.to && comparePositions(selection.from, selection.to) > 0,
  );

  editor.transaction({
    changes: normalizeChanges(changes),
    selections: newSelections.map((selection) =>
      selection.to && comparePositions(selection.from, selection.to) > 0
        ? { from: selection.to, to: selection.from }
        : selection,
    ),
  });

  if (hasReversedSelection) {
    editor.setSelections(
      newSelections.map((selection) => ({
        anchor: selection.from,
        head: selection.to ?? selection.from,
      })),
    );
  }
};

/**
 * Executes the supplied callback for each top-level CodeMirror (CM6) content
 * div element in the DOM, as Obsidian's `iterateCodeMirrors` method only
 * works with CM5.
 */
export const iterateCodeMirrorDivs = (callback: (cm: HTMLElement) => any) => {
  document.querySelectorAll<HTMLElement>('.cm-content').forEach(callback);
};

export const getLineStartPos = (line: number): EditorPosition => ({
  line,
  ch: 0,
});

export const getLineEndPos = (
  line: number,
  editor: Editor,
): EditorPosition => ({
  line,
  ch: editor.getLine(line).length,
});

export const getSelectionBoundaries = (selection: EditorSelection) => {
  let { anchor: from, head: to } = selection;

  // In case user selects upwards
  if (from.line > to.line) {
    [from, to] = [to, from];
  }

  // In case user selects backwards on the same line
  if (from.line === to.line && from.ch > to.ch) {
    [from, to] = [to, from];
  }

  return { from, to, hasTrailingNewline: to.line > from.line && to.ch === 0 };
};

export const getLeadingWhitespace = (lineContent: string) => {
  const indentation = lineContent.match(/^\s+/);
  return indentation ? indentation[0] : '';
};

// Match any character from any language: https://www.regular-expressions.info/unicode.html
const isLetterCharacter = (char: string) => /\p{L}\p{M}*/u.test(char);

const isDigit = (char: string) => /\d/.test(char);

const isLetterOrDigit = (char: string) =>
  isLetterCharacter(char) || isDigit(char);

export const wordRangeAtPos = (
  pos: EditorPosition,
  lineContent: string,
): { anchor: EditorPosition; head: EditorPosition } => {
  let start = pos.ch;
  let end = pos.ch;
  while (start > 0 && isLetterOrDigit(lineContent.charAt(start - 1))) {
    start--;
  }
  while (end < lineContent.length && isLetterOrDigit(lineContent.charAt(end))) {
    end++;
  }
  return {
    anchor: {
      line: pos.line,
      ch: start,
    },
    head: {
      line: pos.line,
      ch: end,
    },
  };
};

export type CheckCharacter = (char: string) => boolean;

export const findPosOfNextCharacter = ({
  editor,
  startPos,
  checkCharacter,
  searchDirection,
}: {
  editor: Editor;
  startPos: EditorPosition;
  checkCharacter: CheckCharacter;
  searchDirection: SEARCH_DIRECTION;
}) => {
  let { line, ch } = startPos;
  let lineContent = editor.getLine(line);
  let matchFound = false;
  let matchedChar: string;

  if (searchDirection === SEARCH_DIRECTION.BACKWARD) {
    while (line >= 0) {
      // ch will initially be 0 if searching from start of line
      const char = lineContent.charAt(Math.max(ch - 1, 0));
      matchFound = checkCharacter(char);
      if (matchFound) {
        matchedChar = char;
        break;
      }
      ch--;
      // inclusive because (ch - 1) means the first character will already
      // have been checked
      if (ch <= 0) {
        line--;
        if (line >= 0) {
          lineContent = editor.getLine(line);
          ch = lineContent.length;
        }
      }
    }
  } else {
    while (line < editor.lineCount()) {
      const char = lineContent.charAt(ch);
      matchFound = checkCharacter(char);
      if (matchFound) {
        matchedChar = char;
        break;
      }
      ch++;
      if (ch >= lineContent.length) {
        line++;
        lineContent = editor.getLine(line);
        ch = 0;
      }
    }
  }

  return matchFound
    ? {
        match: matchedChar,
        pos: {
          line,
          ch,
        },
      }
    : null;
};

export const hasSameSelectionContent = (
  editor: Editor,
  selections: EditorSelection[],
) =>
  new Set(
    selections.map((selection) => {
      const { from, to } = getSelectionBoundaries(selection);
      return editor.getRange(from, to);
    }),
  ).size === 1;

export const getSearchText = ({
  editor,
  allSelections,
  autoExpand,
}: {
  editor: Editor;
  allSelections: EditorSelection[];
  autoExpand: boolean;
}) => {
  // Don't search if multiple selection contents are not identical
  const singleSearchText = hasSameSelectionContent(editor, allSelections);
  const firstSelection = allSelections[0];
  const { from, to } = getSelectionBoundaries(firstSelection);
  let searchText = editor.getRange(from, to);
  if (searchText.length === 0 && autoExpand) {
    const wordRange = wordRangeAtPos(from, editor.getLine(from.line));
    searchText = editor.getRange(wordRange.anchor, wordRange.head);
  }
  return {
    searchText,
    singleSearchText,
  };
};

/**
 * Escapes any special regex characters in the given string.
 *
 * Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
const escapeRegex = (input: string) =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string

/**
 * Constructs a custom regex query with word boundaries because in `\b` in JS doesn't
 * match word boundaries for unicode characters, even with the unicode flag on.
 *
 * Adapted from https://shiba1014.medium.com/regex-word-boundaries-with-unicode-207794f6e7ed.
 */
const withWordBoundaries = (input: string) => `(?<=\\W|^)${input}(?=\\W|$)`;

export const findAllMatches = ({
  searchText,
  searchWithinWords,
  documentContent,
}: {
  searchText: string;
  searchWithinWords: boolean;
  documentContent: string;
}) => {
  const escapedSearchText = escapeRegex(searchText);
  const searchExpression = new RegExp(
    searchWithinWords
      ? escapedSearchText
      : withWordBoundaries(escapedSearchText),
    'g',
  );
  return Array.from(documentContent.matchAll(searchExpression));
};

export const findNextMatchPosition = ({
  editor,
  latestMatchPos,
  searchText,
  searchWithinWords,
  documentContent,
}: {
  editor: Editor;
  latestMatchPos: EditorPosition;
  searchText: string;
  searchWithinWords: boolean;
  documentContent: string;
}) => {
  const latestMatchOffset = editor.posToOffset(latestMatchPos);
  const matches = findAllMatches({
    searchText,
    searchWithinWords,
    documentContent,
  });
  let nextMatch: EditorSelection | null = null;

  for (const match of matches) {
    if (match.index > latestMatchOffset) {
      nextMatch = {
        anchor: editor.offsetToPos(match.index),
        head: editor.offsetToPos(match.index + searchText.length),
      };
      break;
    }
  }
  // Circle back to search from the top
  if (!nextMatch) {
    const selectionIndexes = editor.listSelections().map((selection) => {
      const { from } = getSelectionBoundaries(selection);
      return editor.posToOffset(from);
    });
    for (const match of matches) {
      if (!selectionIndexes.includes(match.index)) {
        nextMatch = {
          anchor: editor.offsetToPos(match.index),
          head: editor.offsetToPos(match.index + searchText.length),
        };
        break;
      }
    }
  }

  return nextMatch;
};

export const findAllMatchPositions = ({
  editor,
  searchText,
  searchWithinWords,
  documentContent,
}: {
  editor: Editor;
  searchText: string;
  searchWithinWords: boolean;
  documentContent: string;
}) => {
  const matches = findAllMatches({
    searchText,
    searchWithinWords,
    documentContent,
  });
  const matchPositions = [];
  for (const match of matches) {
    matchPositions.push({
      anchor: editor.offsetToPos(match.index),
      head: editor.offsetToPos(match.index + searchText.length),
    });
  }
  return matchPositions;
};

export const toTitleCase = (selectedText: string) => {
  // use capture group to join with the same separator used to split
  return selectedText
    .split(/(\s+)/)
    .map((word, index, allWords) => {
      if (
        index > 0 &&
        index < allWords.length - 1 &&
        LOWERCASE_ARTICLES.includes(word.toLowerCase())
      ) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
    })
    .join('');
};

export const getNextCase = (selectedText: string): string => {
  const textUpper = selectedText.toUpperCase();
  const textLower = selectedText.toLowerCase();
  const textTitle = toTitleCase(selectedText);

  switch (selectedText) {
    case textUpper: {
      return textLower;
    }
    case textLower: {
      return textTitle;
    }
    case textTitle: {
      return textUpper;
    }
    default: {
      return textUpper;
    }
  }
};

/**
 * Checks if an input string is numeric.
 *
 * Adapted from https://stackoverflow.com/a/60548119
 */
export const isNumeric = (input: string) => input.length > 0 && !isNaN(+input);

/**
 * Determines the next markdown list character prefix for a given line.
 *
 * If it's an ordered list and direction is `after`, the prefix will be
 * incremented by 1.
 *
 * If it's a checklist, the newly inserted checkbox will always be unticked.
 *
 * If the current list item is empty, this will be indicated by a `null` prefix.
 */
export const getNextListPrefix = (
  text: string,
  direction: 'before' | 'after',
): string | null => {
  const listChars = text.match(LIST_CHARACTER_REGEX);
  if (listChars && listChars.length > 0) {
    let prefix = listChars[0].trimStart();
    const isEmptyListItem = prefix === listChars.input.trimStart();
    if (isEmptyListItem) {
      return null;
    }
    if (isNumeric(prefix) && direction === 'after') {
      prefix = +prefix + 1 + '. ';
    }
    if (prefix.startsWith('- [') && !prefix.includes('[ ]')) {
      prefix = '- [ ] ';
    }
    return prefix;
  }
  return '';
};

export const formatRemainingListPrefixes = (
  editor: Editor,
  fromLine: number,
  indentation: string,
) => {
  const changes: EditorChange[] = [];

  for (let i = fromLine; i < editor.lineCount(); i++) {
    const contentsOfCurrentLine = editor.getLine(i);
    // Only prefixes at the same indentation level should be updated
    const listPrefixRegex = new RegExp(`^${indentation}\\d+\\.`);
    const lineStartsWithNumberPrefix = listPrefixRegex.test(
      contentsOfCurrentLine,
    );
    if (!lineStartsWithNumberPrefix) {
      break;
    }
    const replacementContent = contentsOfCurrentLine.replace(
      /\d+\./,
      (match) => +match + 1 + '.',
    );
    changes.push({
      from: { line: i, ch: 0 },
      to: { line: i, ch: contentsOfCurrentLine.length },
      text: replacementContent,
    });
  }

  if (changes.length > 0) {
    editor.transaction({ changes });
  }
};

type VaultConfigSetting = 'showLineNumber' | 'useTab';

export const toggleVaultConfig = (app: App, setting: VaultConfigSetting) => {
  // @ts-expect-error - getConfig is not in the public API
  const value = app.vault.getConfig(setting);
  setVaultConfig(app, setting, !value);
};

export const setVaultConfig = (
  app: App,
  setting: VaultConfigSetting,
  value: boolean,
) => {
  // @ts-expect-error - setConfig is not in the public API
  app.vault.setConfig(setting, value);
};
