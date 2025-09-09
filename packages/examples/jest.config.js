module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    globalTeardown: '<rootDir>/src/__tests__/global-teardown.js',
    globalSetup: '<rootDir>/src/__tests__/global-setup.js',
    // Optional: Set test timeout if server startup is slow
    testTimeout: 30000,
};