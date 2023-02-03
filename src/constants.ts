export enum CASE {
  UPPER = 'upper',
  LOWER = 'lower',
  TITLE = 'title',
  NEXT = 'next',
}

export const LOWERCASE_ARTICLES = ['the', 'a', 'an'];

export enum SEARCH_DIRECTION {
  FORWARD = 'forward',
  BACKWARD = 'backward',
}

export type MatchingCharacterMap = { [key: string]: string };

export const MATCHING_BRACKETS: MatchingCharacterMap = {
  '[': ']',
  '(': ')',
  '{': '}',
};

export const MATCHING_QUOTES: MatchingCharacterMap = {
  "'": "'",
  '"': '"',
  '`': '`',
};

export const MATCHING_QUOTES_BRACKETS: MatchingCharacterMap = {
  ...MATCHING_QUOTES,
  ...MATCHING_BRACKETS,
};

export enum CODE_EDITOR {
  SUBLIME = 'sublime',
  VSCODE = 'vscode',
}

export const MODIFIER_KEYS = [
  'Control',
  'Shift',
  'Alt',
  'Meta',
  'CapsLock',
  'Fn',
];

/**
 * Captures the prefix (including space) for bullet lists, numbered lists
 * and checklists
 */
export const LIST_CHARACTER_REGEX = /^\s*(-|\+|\*|\d+\.|>) (\[.\] )?/;
