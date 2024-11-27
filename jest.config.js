module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'jsonld'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/src/**/*.ts',
    '!**/examples/**',
    '!packages/cli/**',
    '!**/types/**',
    '!**/dist/**',
    '!**/.yalc/**',
    '!**/node_modules/**',
    '!**/packages/**/index.ts'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'json'
  ],
  coverageDirectory: './coverage',
  transform: {
    '\\.jsx?$': 'babel-jest',
    '\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './packages/tsconfig-base.json'
      }
    ]
  },
  setupFiles: [
    "<rootDir>./jest.polyfills.js"
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/packages/presentation-exchange/.yalc/',
    '<rootDir>/packages/siopv2-oid4vp-rp-auth/.yalc/',
    '<rootDir>/packages/siopv2-oid4vp-rp-rest-api/.yalc/'
  ],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(nist-weierstrauss|multiformatsgggggg|@transmute+ed25519-key-pair|@digitalcredentials\\+credentials-v2-context|@digitalcredentials\\+jsonld-signature|@digitalcredentials\\+vc-status-list|valibot)@)'
  ],
  testMatch: [
    '**/__tests__/**/*.test.*',
    '!**/.yalc/**',
    '!dist/*'
  ],
  globals: {
    'ts-jest': {
      tsconfig: './packages/tsconfig-base.json'
    }
  },
  testEnvironment: 'node',
  automock: false,
  verbose: true
};
