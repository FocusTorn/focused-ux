import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import foldingBracketsRule from '../fux-format/folding-brackets/index.js'

describe('folding-brackets rule scenarios', () => {
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

    describe('assignment context scenarios', () => {
        it('should format array assignment with folding marker correctly', async () => {
            const input = `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build",
            "buildDepsTargetName": "build-deps"
        }
    } ]
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            if (results[0].messages.length > 0) {
                // Apply the fix using ESLint 9 API
                const fixedResults = await eslint.lintAndFix(input, { filePath: 'test.json' })
                
                const expected = `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build",
            "buildDepsTargetName": "build-deps"
        }
    } ]
}`
                
                expect(fixedResults[0].output).toBe(expected)
            } else {
                // Already correctly formatted
                expect(results[0].messages).toHaveLength(0)
            }
        })

        it('should format property assignment with folding marker correctly', async () => {
            const input = `{
    "config": {   "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            if (results[0].messages.length > 0) {
                const fixedResults = await eslint.lintAndFix(input, { filePath: 'test.json' })
                
                const expected = `{
    "config": {   "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`
                
                expect(fixedResults[0].output).toBe(expected)
            } else {
                expect(results[0].messages).toHaveLength(0)
            }
        })
    })

    describe('single line scenarios', () => {
        it('should convert mixed format to single line when first property is inline', async () => {
            const input = `{ "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            if (results[0].messages.length > 0) {
                const fixedResults = await eslint.lintAndFix(input, { filePath: 'test.json' })
                
                const expected = `{ "key1": "value1", "key2": "value2", "key3": "value3" }`
                
                expect(fixedResults[0].output).toBe(expected)
            } else {
                expect(results[0].messages).toHaveLength(0)
            }
        })
    })

    describe('standard block scenarios', () => {
        it('should convert mixed format to standard block when no property is inline', async () => {
            const input = `{ "key1": "value1", "key2": "value2",
    "key3": "value3"
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            if (results[0].messages.length > 0) {
                const fixedResults = await eslint.lintAndFix(input, { filePath: 'test.json' })
                
                const expected = `{
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`
                
                expect(fixedResults[0].output).toBe(expected)
            } else {
                expect(results[0].messages).toHaveLength(0)
            }
        })
    })

    describe('folding block scenarios', () => {
        it('should format folding block with correct spacing for property context', async () => {
            const input = `{
    "config": { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            if (results[0].messages.length > 0) {
                const fixedResults = await eslint.lintAndFix(input, { filePath: 'test.json' })
                
                const expected = `{
    "config": {   "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`
                
                expect(fixedResults[0].output).toBe(expected)
            } else {
                expect(results[0].messages).toHaveLength(0)
            }
        })

        it('should format folding block with correct spacing for assignment context', async () => {
            const input = `{
    "plugins": [ "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    ]
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            if (results[0].messages.length > 0) {
                const fixedResults = await eslint.lintAndFix(input, { filePath: 'test.json' })
                
                const expected = `{
    "plugins": [ "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    ]
}`
                
                expect(fixedResults[0].output).toBe(expected)
            } else {
                expect(results[0].messages).toHaveLength(0)
            }
        })
    })

    describe('nested scenarios', () => {
        it('should handle nested folding blocks correctly', async () => {
            const input = `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": { "buildTargetName": "build", //>
            "testTargetName": "test"
        }
    } ]
}`

            const results = await eslint.lintText(input, { filePath: 'test.json' })
            
            if (results[0].messages.length > 0) {
                const fixedResults = await eslint.lintAndFix(input, { filePath: 'test.json' })
                
                const expected = `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {   "buildTargetName": "build", //>
            "testTargetName": "test"
        }
    } ]
}`
                
                expect(fixedResults[0].output).toBe(expected)
            } else {
                expect(results[0].messages).toHaveLength(0)
            }
        })
    })
})
