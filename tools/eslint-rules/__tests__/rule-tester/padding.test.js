import { RuleTester } from 'eslint'
import paddingRule from '../../fux-plugin/rules/padding.js'
import foldingBracketsRule from '../../fux-plugin/rules/folding-brackets.js'

// Test the padding rule
const paddingRuleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
})

paddingRuleTester.run('@fux/padding', paddingRule, {
    valid: [
        // Test spacing around describe blocks
        {
            code: 'describe("My Suite", () => {\n    it("should work", () => {})\n})',
            options: [{
                patterns: [{
                    blankLine: 'never',
                    prev: 'describe',
                    next: 'it'
                }]
            }]
        },
        
        // Test variable declaration spacing
        {
            code: 'const a = 1\n\nconst b = 2',
            options: [{
                patterns: [{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }]
            }]
        },
        
        // Test consecutive it blocks (no spacing)
        {
            code: 'describe("Suite", () => {\n    it("test1", () => {})\n    it("test2", () => {})\n})',
            options: [{
                patterns: [{
                    blankLine: 'never',
                    prev: 'it',
                    next: 'it'
                }]
            }]
        },
    ],
    invalid: [
        {
            code: 'describe("Suite", () => {})\n\nit("test", () => {})',
            options: [{
                patterns: [{
                    blankLine: 'never',
                    prev: 'describe',
                    next: 'it'
                }]
            }],
            errors: [{ messageId: 'disallowBlankLine' }],
            output: 'describe("Suite", () => {})\nit("test", () => {})',
        },
        {
            code: 'const a = 1\nconst b = 2',
            options: [{
                patterns: [{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }]
            }],
            errors: [{ messageId: 'requireBlankLine' }],
            output: 'const a = 1\n\nconst b = 2',
        },
        {
            code: 'it("test1", () => {})\n\nit("test2", () => {})',
            options: [{
                patterns: [{
                    blankLine: 'never',
                    prev: 'it',
                    next: 'it'
                }]
            }],
            errors: [{ messageId: 'disallowBlankLine' }],
            output: 'it("test1", () => {})\nit("test2", () => {})',
        },
    ],
})

// Test the folding-brackets rule
const foldingRuleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
})

foldingRuleTester.run('@fux/folding-brackets', foldingBracketsRule, {
    valid: [
        'const obj = { //>\n    prop: "value"\n} //<',
        'if (condition) { //>\n    doSomething()\n} //<',
    ],
    invalid: [
        {
            code: 'const obj = {\n    prop: "value"\n}',
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
    ],
})
