import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import foldingBracketsRule from '../../fux-format/folding-brackets/index.js'

describe('debug folding-brackets rule', () => {
    it('should debug single line format', async () => {
        const eslint = new ESLint({
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

        const code = '{ "key1": "value1", "key2": "value2", "key3": "value3" }'
        const results = await eslint.lintText(code, { filePath: 'test.json' })
        
        console.log('Results:', JSON.stringify(results, null, 2))
        expect(results[0].messages).toHaveLength(0)
    })

    it('should debug mixed format', async () => {
        const eslint = new ESLint({
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

        const code = `{ "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`
        const results = await eslint.lintText(code, { filePath: 'test.json' })
        
        console.log('Results:', JSON.stringify(results, null, 2))
        console.log('Messages count:', results[0].messages.length)
        if (results[0].messages.length > 0) {
            console.log('First message:', results[0].messages[0])
        }
    })
})

