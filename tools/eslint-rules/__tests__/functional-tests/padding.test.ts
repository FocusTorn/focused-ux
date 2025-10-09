import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ESLint } from 'eslint'
import { setupEslintRulesTestEnvironment, resetEslintRulesMocks, type EslintRulesTestMocks } from '../__mocks__/helpers.js'
import { createEslintRulesMockBuilder } from '../__mocks__/mock-scenario-builder.js'

describe('Universal Padding ESLint Rule', () => {
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

    describe('Basic Padding Patterns', () => {

        it('should require blank line between const declarations', async () => { //>
            const code = `const a = 1
const b = 2`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should accept blank line between const declarations', async () => { //>
            const code = `const a = 1

const b = 2`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should disallow blank line between const declarations when never', async () => { //>
            const code = `const a = 1

const b = 2`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'never',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('disallowBlankLine')
        }) //<

        it('should accept no blank line between const declarations when never', async () => { //>
            const code = `const a = 1
const b = 2`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'never',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

    })

    describe('Test Function Patterns', () => {

        it('should require blank line between it blocks', async () => { //>
            const code = `it('should do something', () => {
    // test code
})
it('should do something else', () => {
    // test code
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'it',
                    next: 'it'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should accept blank line between it blocks', async () => { //>
            const code = `it('should do something', () => {
    // test code
})

it('should do something else', () => {
    // test code
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'it',
                    next: 'it'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should require blank line between describe blocks', async () => { //>
            const code = `describe('Test Suite 1', () => {
    // tests
})
describe('Test Suite 2', () => {
    // tests
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'describe',
                    next: 'describe'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should require blank line between beforeEach blocks', async () => { //>
            const code = `beforeEach(() => {
    // setup
})
beforeEach(() => {
    // more setup
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'beforeEach',
                    next: 'beforeEach'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

    })

    describe('Mixed Statement Types', () => {

        it('should require blank line between const and it', async () => { //>
            const code = `const mockData = { test: 'value' }
it('should use mock data', () => {
    // test code
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'it'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should accept blank line between const and it', async () => { //>
            const code = `const mockData = { test: 'value' }

it('should use mock data', () => {
    // test code
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'it'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should require blank line between let and describe', async () => { //>
            const code = `let testVar = 'value'
describe('Test Suite', () => {
    // tests
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'let',
                    next: 'describe'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

    })

    describe('Custom Matchers', () => {

        it('should work with custom test matcher', async () => { //>
            const code = `test('should do something', () => {
    // test code
})
test('should do something else', () => {
    // test code
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'test',
                    next: 'test'
                }])
                .withCustomMatchers({
                    'test': 'test\\s*\\('
                })
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should work with custom beforeEach matcher', async () => { //>
            const code = `beforeEach(() => {
    // setup
})
beforeEach(() => {
    // more setup
})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'beforeEach',
                    next: 'beforeEach'
                }])
                .withCustomMatchers({
                    'beforeEach': 'beforeEach\\s*\\('
                })
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

    })

    describe('Wildcard Patterns', () => {

        it('should work with wildcard prev pattern', async () => { //>
            const code = `const a = 1
it('should test', () => {})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: '*',
                    next: 'it'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should work with wildcard next pattern', async () => { //>
            const code = `it('should test', () => {})
const a = 1`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'it',
                    next: '*'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should work with both wildcards', async () => { //>
            const code = `const a = 1
const b = 2`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: '*',
                    next: '*'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

    })

    describe('Array Patterns', () => {

        it('should work with array of prev types', async () => { //>
            const code = `const a = 1
it('should test', () => {})`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: ['const', 'let'],
                    next: 'it'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

        it('should work with array of next types', async () => { //>
            const code = `it('should test', () => {})
const a = 1`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'it',
                    next: ['const', 'let']
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(1)
            expect(results[0].messages[0].messageId).toBe('requireBlankLine')
        }) //<

    })

    describe('Edge Cases', () => {

        it('should handle empty file', async () => { //>
            const code = ''
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should handle file with only one statement', async () => { //>
            const code = `const a = 1`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should handle file with only comments', async () => { //>
            const code = `// This is just a comment
// Another comment`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

        it('should handle multiple blank lines', async () => { //>
            const code = `const a = 1


const b = 2`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            expect(results[0].messages).toHaveLength(0)
        }) //<

    })

    describe('Error Scenarios', () => {

        it('should handle malformed JavaScript gracefully', async () => { //>
            const code = `const a = 1
const b = // Missing value`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldFail()
                .withPatterns([{
                    blankLine: 'always',
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            // ESLint should handle malformed code gracefully
            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            // Should not crash, may have parsing errors but not our rule errors
            expect(results).toBeDefined()
        }) //<

        it('should handle invalid pattern configuration gracefully', async () => { //>
            const code = `const a = 1
const b = 2`
            
            const scenario = await createEslintRulesMockBuilder(mocks)
                .padding()
                .withCode(code)
                .shouldPass()
                .withPatterns([{
                    blankLine: 'invalid' as any,
                    prev: 'const',
                    next: 'const'
                }])
                .build()

            const results = await scenario.lintText(code, { filePath: 'test.padding.js' })
            
            // Should not crash with invalid configuration
            expect(results).toBeDefined()
        }) //<

    })

})
