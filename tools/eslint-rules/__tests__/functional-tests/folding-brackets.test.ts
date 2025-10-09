import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ESLint } from 'eslint'
import { setupEslintRulesTestEnvironment, resetEslintRulesMocks, type EslintRulesTestMocks } from '../__mocks__/helpers.js'
import { createEslintRulesMockBuilder } from '../__mocks__/mock-scenario-builder.js'

describe('Folding Brackets ESLint Rule', () => {
    // SETUP ----------------->>
    let mocks: EslintRulesTestMocks
    //----------------------------------------------------<<

    beforeEach(async () => { //>
        mocks = await setupEslintRulesTestEnvironment()
        await resetEslintRulesMocks(mocks)
    }) //<

    afterEach(() => { //>
        // Clean up any test-specific state
    }) //<

    describe('Valid Format Detection', () => {

        it('should accept single line object format', async () => { //>
            const code = 'const obj = { "key1": "value1", "key2": "value2", "key3": "value3" }'
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            // Filter out workspace rules and only check our rule
            const ourRuleMessages = results[0].messages.filter(msg => msg.ruleId === 'test-folding-brackets/folding-brackets')
            expect(ourRuleMessages).toHaveLength(0)
        }) //<

        it('should accept standard block format', async () => { //>
            const code = `const obj = {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            // Filter out workspace rules and only check our rule
            const ourRuleMessages = results[0].messages.filter(msg => msg.ruleId === 'test-folding-brackets/folding-brackets')
            expect(ourRuleMessages).toHaveLength(0)
        }) //<

        it('should accept folding format with proper markers', async () => { //>
            const code = `{   "key1": "value1", //>
    "key2": "value2",
    "key3": "value3"
} //<`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should accept empty object', async () => { //>
            const code = '{}'
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should accept single property object', async () => { //>
            const code = '{ "key": "value" }'
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

    })

    describe('Invalid Format Detection', () => {

        it('should detect missing folding markers in multi-line object', async () => { //>
            const code = `const obj = { "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldFail('single')
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('missingFoldingMarkers')
        }) //<

        it('should detect missing folding markers in mixed format', async () => { //>
            const code = `const obj = { "key1": "value1", "key2": "value2",
    "key3": "value3"
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldFail('standard')
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('missingFoldingMarkers')
        }) //<

        it('should detect missing folding markers in nested object', async () => { //>
            const code = `const obj = {
    "config": { "plugin": "@nx/vite/plugin",
        "options": {
            "buildTargetName": "build"
        }
    }
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldFail('folding')
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('missingFoldingMarkers')
        }) //<

    })

    describe('Array Expression Detection', () => {

        it('should detect missing folding markers in multi-line array', async () => { //>
            const code = `const arr = [
    "item1",
    "item2",
    "item3"
]`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldFail('standard')
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('missingFoldingMarkers')
        }) //<

        it('should accept single line array', async () => { //>
            const code = '["item1", "item2", "item3"]'
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should accept array with proper folding markers', async () => { //>
            const code = `[   "item1", //>
    "item2",
    "item3"
] //<`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

    })

    describe('Real-World Scenarios', () => {

        it('should handle vite config format correctly', async () => { //>
            const code = `{
    "plugin": "@nx/vite/plugin",
    "options": {
        "buildTargetName": "build",
        "testTargetName": "vite:test",
        "serveTargetName": "serve"
    }
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should detect issue in vite config with mixed format', async () => { //>
            const code = `const config = { "plugin": "@nx/vite/plugin",
    "options": {
        "buildTargetName": "build",
        "testTargetName": "vite:test",
        "serveTargetName": "serve"
    }
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldFail('single')
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('missingFoldingMarkers')
        }) //<

        it('should handle folding format with triple space correctly', async () => { //>
            const code = `{   "plugin": "@nx/vite/plugin", //>
    "options": {
        "buildTargetName": "build",
        "testTargetName": "vite:test",
        "serveTargetName": "serve"
    }
} //<`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should handle nested folding blocks correctly', async () => { //>
            const code = `{
    "plugins": [ {   "plugin": "@nx/vite/plugin", //>
        "options": {   "buildTargetName": "build", //>
            "testTargetName": "test"
        } //<
    } ] //<
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

    })

    describe('Edge Cases', () => {

        it('should handle object with only whitespace', async () => { //>
            const code = '{ }'
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should handle object with comments', async () => { //>
            const code = `{
    // This is a comment
    "key": "value"
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should handle object with trailing comma', async () => { //>
            const code = `{
    "key1": "value1",
    "key2": "value2",
}`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

    })

    describe('Error Scenarios', () => {

        it('should handle malformed JSON gracefully', async () => { //>
            const code = '{ "key": "value" // Missing closing brace'
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldFail('standard')
                .build()

            // ESLint should handle malformed code gracefully
            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            // Should not crash, may have parsing errors but not our rule errors
            expect(results).toBeDefined()
        }) //<

        it('should handle empty file gracefully', async () => { //>
            const code = ''
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should handle file with only comments', async () => { //>
            const code = '// This is just a comment'
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .foldingBrackets()
                .withCode(code)
                .shouldPass()
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.folding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

    })

})