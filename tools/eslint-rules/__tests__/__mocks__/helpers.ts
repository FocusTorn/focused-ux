import { vi } from 'vitest'
import { ESLint } from 'eslint'

// Core test environment interface for ESLint rules
export interface ESLintTestMocks {
    eslint: ESLint
}

// Environment setup
export function setupTestEnvironment(): ESLintTestMocks {
    return {
        eslint: new ESLint({
            baseConfig: [{
                languageOptions: {
                    parser: require('@typescript-eslint/parser'),
                    parserOptions: {
                        ecmaVersion: 2020,
                        sourceType: 'module',
                    },
                },
            }],
        })
    }
}

// Mock reset utilities
export function resetAllMocks(mocks: ESLintTestMocks): void {
    // ESLint instances don't need resetting, but we can clear any cached results
    vi.clearAllMocks()
}

// Helper to create ESLint config with custom rules
export function createESLintConfigWithRule(ruleName: string, rule: any): ESLint {
    return new ESLint({
        baseConfig: [{
            rules: {
                [`${ruleName}/${ruleName}`]: 'error',
            },
            plugins: {
                [ruleName]: { rules: { [ruleName]: rule } }
            },
            languageOptions: {
                parser: require('@typescript-eslint/parser'),
                parserOptions: {
                    ecmaVersion: 2020,
                    sourceType: 'module',
                },
            },
        }],
    })
}

