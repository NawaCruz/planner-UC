import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '<rootDir>/components/**/*.{ts,tsx}',
    '<rootDir>/app/**/*.{ts,tsx}',
    '<rootDir>/lib/**/*.{ts,tsx}',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/app/api/**',
    '!<rootDir>/app/layout.tsx',
    '!<rootDir>/app/page.tsx',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  transformIgnorePatterns: ['/node_modules/(?!(msw|@mswjs|until-async)/)'],
}

export default createJestConfig(config)
