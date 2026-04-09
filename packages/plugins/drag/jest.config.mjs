export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@drag/(.*)$': '<rootDir>/src/$1',
    '^@dayflow/core$': '<rootDir>/../core/src/index.ts',
    '^preact$': '<rootDir>/node_modules/preact/dist/preact.js',
    '^preact/hooks$': '<rootDir>/node_modules/preact/hooks/dist/hooks.js',
    '^preact/jsx-runtime$':
      '<rootDir>/node_modules/preact/jsx-runtime/dist/jsxRuntime.js',
    '^preact/compat$': '<rootDir>/node_modules/preact/compat/dist/compat.js',
  },
};
