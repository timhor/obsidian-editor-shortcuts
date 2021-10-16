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

export const MATCHING_BRACKETS: { [key: string]: string } = {
  '[': ']',
  '(': ')',
  '{': '}',
};
