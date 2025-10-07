import { ESLint } from 'eslint'
import { ESLintTestMocks } from './helpers'

// ESLint Rule Test Scenarios
export interface ESLintRuleScenarioOptions {
    ruleName: string
    rule: any
    code: string
    filePath?: string
    expectedMessages?: number
    expectedMessageId?: string
    expectedFormat?: string
}

export function setupESLintRuleScenario(
    mocks: ESLintTestMocks,
    options: ESLintRuleScenarioOptions
): ESLint {
    const { ruleName, rule } = options
    
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

// Folding Brackets Specific Scenarios
export interface FoldingBracketsScenarioOptions {
    code: string
    filePath?: string
    expectedFormat?: 'single' | 'standard' | 'folding'
    shouldPass?: boolean
}

export function setupFoldingBracketsScenario(
    mocks: ESLintTestMocks,
    options: FoldingBracketsScenarioOptions
): ESLint {
    const foldingBracketsRule = require('../../fux-format/folding-brackets/index.js').default
    
    return new ESLint({
        baseConfig: [{
            rules: {
                'folding-brackets/folding-brackets': 'error',
            },
            plugins: {
                'folding-brackets': { rules: { 'folding-brackets': foldingBracketsRule } }
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

// Fluent Builder Pattern for ESLint Rules
export class ESLintRuleMockBuilder {
    constructor(private mocks: ESLintTestMocks) {}

    foldingBrackets(options: FoldingBracketsScenarioOptions): ESLintRuleMockBuilder {
        this.mocks.eslint = setupFoldingBracketsScenario(this.mocks, options)
        return this
    }

    customRule(options: ESLintRuleScenarioOptions): ESLintRuleMockBuilder {
        this.mocks.eslint = setupESLintRuleScenario(this.mocks, options)
        return this
    }

    build(): ESLintTestMocks {
        return this.mocks
    }
}

export function createESLintRuleMockBuilder(mocks: ESLintTestMocks): ESLintRuleMockBuilder {
    return new ESLintRuleMockBuilder(mocks)
}

