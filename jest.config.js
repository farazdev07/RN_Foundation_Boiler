module.exports = {
  preset: '@react-native/jest-preset',
  // Loads Reanimated and Worklets' web implementations, which run under Node.
  resolver: 'react-native-reanimated/jest/resolver',
  setupFiles: ['react-native-gesture-handler/jestSetup'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@entities/(.*)$': '<rootDir>/src/entities/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native[^/]*|@react-native(-community)?|@react-native-vector-icons|@react-navigation|react-redux|immer)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tools/boundary-fixtures/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.types.ts',
    '!src/**/testing/**',
    '!src/screens/home/ui/RuntimeCheck.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
