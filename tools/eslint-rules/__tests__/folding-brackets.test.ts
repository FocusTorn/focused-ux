import { describe, it, expect, beforeEach } from 'vitest'
import { ESLint } from 'eslint'
import { setupTestEnvironment, resetAllMocks } from './__mocks__/helpers'
import { setupFoldingBracketsScenario } from './__mocks__/mock-scenario-builder'

describe('folding-brackets rule', () => {
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
    })

    describe('valid cases', () => {
        it('should accept single line format', async () => {
            const code = '{ "key1": "value1", "key2": "value2", "key3": "value3" }'
            const eslint = setupFoldingBracketsScenario(mocks, { code, shouldPass: true })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(0)
        })

        it('should accept standard block format', async () => {
            const code = `{
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, shouldPass: true })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(0)
        })

        it('should accept folding block format with triple space', async () => {
            const code = `{   "key1": "value1", //>
    "key2": "value2",
    "key3": "value3"
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, shouldPass: true })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(0)
        })

        it('should accept empty object', async () => {
            const code = '{}'
            const eslint = setupFoldingBracketsScenario(mocks, { code, shouldPass: true })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(0)
        })

        it('should accept single property', async () => {
            const code = '{ "key": "value" }'
            const eslint = setupFoldingBracketsScenario(mocks, { code, shouldPass: true })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(0)
        })
    })

    describe('invalid cases', () => {
        it('should fix mixed format to single line when first property is inline', async () => {
            const code = `{ "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, expectedFormat: 'single' })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('single')
        })

        it('should fix mixed format to standard block when no property is inline', async () => {
            const code = `{ "key1": "value1", "key2": "value2",
    "key3": "value3"
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, expectedFormat: 'standard' })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('standard')
        })

        it('should fix incorrect folding format', async () => {
            const code = `{ "key1": "value1",
    "key2": "value2", //>
    "key3": "value3"
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, expectedFormat: 'folding' })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('folding')
        })

        it('should add triple space for folding format', async () => {
            const code = `{ "key1": "value1", //>
    "key2": "value2",
    "key3": "value3"
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, expectedFormat: 'folding' })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('incorrectFormat')
            expect(results[0].messages[0].data?.format).toBe('folding')
        })
    })

    describe('real-world scenarios', () => {
        it('should handle vite config format correctly', async () => {
            const code = `{
    "plugin": "@nx/vite/plugin",
    "options": {
        "buildTargetName": "build",
        "testTargetName": "vite:test",
        "serveTargetName": "serve"
    }
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, shouldPass: true })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(0)
        })

        it('should convert vite config to single line when first property is inline', async () => {
            const code = `{ "plugin": "@nx/vite/plugin",
    "options": {
        "buildTargetName": "build",
        "testTargetName": "vite:test",
        "serveTargetName": "serve"
    }
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, expectedFormat: 'single' })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].data?.format).toBe('single')
        })

        it('should handle folding format with triple space correctly', async () => {
            const code = `{   "plugin": "@nx/vite/plugin", //>
    "options": {
        "buildTargetName": "build",
        "testTargetName": "vite:test",
        "serveTargetName": "serve"
    }
}`
            const eslint = setupFoldingBracketsScenario(mocks, { code, shouldPass: true })
            const results = await eslint.lintText(code, { filePath: 'test.json' })
            expect(results[0].messages).toHaveLength(0)
        })
    })
})