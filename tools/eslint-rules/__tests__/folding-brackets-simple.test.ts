import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import foldingBracketsRule from '../fux-format/folding-brackets/index.js'

describe('folding-brackets rule simple scenarios', () => {
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

    describe('should detect formatting issues', () => {
        it('should detect incorrect folding format in assignment context', async () => {
            const input = `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    } ]
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should detect the issue
            expect(results[0].messages.length).toBeGreaterThan(0)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('folding')
        })

        it('should detect incorrect folding format in property context', async () => {
            const input = `{
    "config": { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should detect the issue
            expect(results[0].messages.length).toBeGreaterThan(0)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('folding')
        })

        it('should detect mixed format that should be single line', async () => {
            const input = `{ "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should detect the issue
            expect(results[0].messages.length).toBeGreaterThan(0)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('single')
        })

        it('should detect mixed format that should be standard block', async () => {
            const input = `{ "key1": "value1", "key2": "value2",
    "key3": "value3"
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should detect the issue
            expect(results[0].messages.length).toBeGreaterThan(0)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('standard')
        })
    })

    describe('should accept correct formats', () => {
        it('should accept correct single line format', async () => {
            const input = `{ "key1": "value1", "key2": "value2", "key3": "value3" }`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should not detect any issues
            expect(results[0].messages).toHaveLength(0)
        })

        it('should accept correct standard block format', async () => {
            const input = `{
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should not detect any issues
            expect(results[0].messages).toHaveLength(0)
        })

        it('should accept correct folding format with 3 spaces in property context', async () => {
            const input = `{
    "config": {   "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should not detect any issues
            expect(results[0].messages).toHaveLength(0)
        })

        it('should accept correct folding format with 1 space in assignment context', async () => {
            const input = `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    } ]
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            // Should not detect any issues
            expect(results[0].messages).toHaveLength(0)
        })
    })
})

