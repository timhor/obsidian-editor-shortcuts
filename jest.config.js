/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],

  // If the test path matches any of the patterns, it will be skipped
  testPathIgnorePatterns: ['/node_modules/', 'test-helpers.ts'],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
};
