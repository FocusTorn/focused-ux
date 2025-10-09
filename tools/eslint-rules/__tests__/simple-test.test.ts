import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import foldingBracketsRule from '../../fux-plugin/rules/folding-brackets.js'
import paddingRule from '../../fux-plugin/rules/padding.js'

describe('Simple ESLint Rules Test', () => {
    it('should load folding brackets rule without errors', () => { //>
        expect(foldingBracketsRule).toBeDefined()
        expect(foldingBracketsRule.meta).toBeDefined()
        expect(foldingBracketsRule.create).toBeDefined()
    }) //<

    it('should load padding rule without errors', () => { //>
        expect(paddingRule).toBeDefined()
        expect(paddingRule.meta).toBeDefined()
        expect(paddingRule.create).toBeDefined()
    }) //<

    it('should create ESLint instance with folding brackets rule', async () => { //>
        const eslint = new ESLint({
            baseConfig: [{
                rules: {
                    'test-folding-brackets/folding-brackets': 'error',
                },
                plugins: {
                    'test-folding-brackets': { rules: { 'folding-brackets': foldingBracketsRule } }
                },
                languageOptions: {
                    parser: require('@typescript-eslint/parser'),
                    ecmaVersion: 2020,
                    sourceType: 'module',
                },
            }],
            fix: true,
        })

        const results = await eslint.lintText('const obj = { prop: "value" }')
        expect(results).toBeDefined()
        expect(results.length).toBeGreaterThan(0)
    }) //<

    it('should create ESLint instance with padding rule', async () => { //>
        const eslint = new ESLint({
            baseConfig: [{
                rules: {
                    'test-padding/padding': ['error', {
                        patterns: [{
                            blankLine: 'always',
                            prev: 'const',
                            next: 'const'
                        }]
                    }],
                },
                plugins: {
                    'test-padding': { rules: { 'padding': paddingRule } }
                },
                languageOptions: {
                    parser: require('@typescript-eslint/parser'),
                    ecmaVersion: 2020,
                    sourceType: 'module',
                },
            }],
            fix: true,
        })

        const results = await eslint.lintText('const a = 1\nconst b = 2')
        expect(results).toBeDefined()
        expect(results.length).toBeGreaterThan(0)
    }) //<
})
