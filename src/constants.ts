export enum CASE {
  UPPER = 'upper',
  LOWER = 'lower',
  TITLE = 'title',
}

export const LOWERCASE_ARTICLES = ['the', 'a', 'an'];

export enum DIRECTION {
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
