import { ESLint } from 'eslint'
import fuxPlugin from '../fux-plugin/index.js'

describe('FocusedUX ESLint Plugin Integration', () => {
    describe('Plugin Structure', () => {
        it('should export rules correctly', () => {
            expect(fuxPlugin.rules).toBeDefined()
            expect(fuxPlugin.rules['padding']).toBeDefined()
            expect(fuxPlugin.rules['folding-brackets']).toBeDefined()
        })

        it('should export configs correctly', () => {
            expect(fuxPlugin.configs).toBeDefined()
            expect(fuxPlugin.configs.recommended).toBeDefined()
            expect(fuxPlugin.configs['test-files']).toBeDefined()
        })

        it('should have correct rule names in configs', () => {
            const recommended = fuxPlugin.configs.recommended
            expect(recommended.plugins).toContain('@fux')
            expect(recommended.rules['@fux/padding']).toBe('error')
            expect(recommended.rules['@fux/folding-brackets']).toBe('error')
        })
    })

    describe('Recommended Config', () => {
        it('should lint with recommended rules', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: fuxPlugin.configs.recommended.rules,
                    }
                ],
            })

            const code = `
const test = 1
describe('test', () => {
    it('should work', () => {})
})
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.js',
            })

            // Should have errors for missing blank line before describe
            expect(results[0].messages.length).toBeGreaterThan(0)
            expect(results[0].messages.some(msg => msg.ruleId === '@fux/padding')).toBe(true)
        })
    })

    describe('Test Files Config', () => {
        it('should lint test files with test-specific rules', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: fuxPlugin.configs['test-files'].rules,
                    }
                ],
            })

            const code = `
const setup = 1
describe('test suite', () => {
    it('first test', () => {})

    it('second test', () => {})
})

describe('another suite', () => {
    it('test', () => {})
})
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.test.js',
            })

            const messages = results[0].messages
            
            // Should catch multiple violations:
            // 1. Missing blank line before first describe
            // 2. Unexpected blank line between it blocks  
            // 3. Missing blank line before second describe
            expect(messages.length).toBeGreaterThanOrEqual(2)
            expect(messages.every(msg => msg.ruleId === '@fux/padding')).toBe(true)
        })

        it('should enforce test file spacing rules', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: fuxPlugin.configs['test-files'].rules,
                    }
                ],
            })

            const code = `
describe('test', () => {
    beforeEach(() => {})

    it('test', () => {})

    afterEach(() => {})
})
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.test.js',
            })

            // Should catch unexpected blank lines between test functions
            const messages = results[0].messages
            expect(messages.length).toBeGreaterThan(0)
            expect(messages.some(msg => msg.ruleId === '@fux/padding')).toBe(true)
        })
    })

    describe('Folding Brackets Rule Integration', () => {
        it('should detect missing folding markers in multi-line blocks', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: fuxPlugin.configs.recommended.rules,
                    }
                ],
            })

            const code = `
const obj = {
    a: 1,
    b: 2
}

function test() {
    return 1
}
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.js',
            })

            const messages = results[0].messages
            const foldingMessages = messages.filter(msg => msg.ruleId === '@fux/folding-brackets')
            
            expect(foldingMessages.length).toBeGreaterThan(0)
            expect(foldingMessages.every(msg => msg.messageId === 'missingFoldingMarkers')).toBe(true)
        })

        it('should pass with correct folding markers', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: fuxPlugin.configs.recommended.rules,
                    }
                ],
            })

            const code = `
const obj = { //>
    a: 1,
    b: 2
} //<

function test() { //>
    return 1
} //<
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.js',
            })

            const foldingMessages = results[0].messages.filter(msg => msg.ruleId === '@fux/folding-brackets')
            expect(foldingMessages.length).toBe(0)
        })
    })

    describe('Padding Rule Integration', () => {
        it('should enforce spacing between statement types', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: fuxPlugin.configs.recommended.rules,
                    }
                ],
            })

            const code = `
const a = 1
const b = 2
describe('test', () => {
    it('first', () => {})

    it('second', () => {})
})
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.js',
            })

            const messages = results[0].messages
            const paddingMessages = messages.filter(msg => msg.ruleId === '@fux/padding')
            
            expect(paddingMessages.length).toBeGreaterThan(0)
        })

        it('should fix spacing issues automatically', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: {
                            '@fux/padding': ['error', {
                                patterns: [
                                    { blankLine: 'always', prev: '*', next: 'const' }
                                ]
                            }]
                        },
                    }
                ],
            })

            const code = `
const a = 1
const b = 2
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.js',
            })

            expect(results[0].messages.length).toBeGreaterThan(0)
            
            // Check if fixes are available
            const fixableMessages = results[0].messages.filter(msg => msg.fix)
            expect(fixableMessages.length).toBeGreaterThan(0)
        })
    })

    describe('Custom Configuration', () => {
        it('should work with custom padding patterns', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: {
                            '@fux/padding': ['error', {
                                patterns: [
                                    { blankLine: 'always', prev: '*', next: ['const', 'var'] }
                                ]
                            }]
                        },
                    }
                ],
            })

            const code = `
let a = 1
const b = 2
var c = 3
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.js',
            })

            const messages = results[0].messages
            expect(messages.length).toBeGreaterThan(0)
            expect(messages.every(msg => msg.ruleId === '@fux/padding')).toBe(true)
        })

        it('should support custom matchers', async () => {
            const eslint = new ESLint({
                baseConfig: [
                    {
                        plugins: {
                            '@fux': fuxPlugin
                        },
                        languageOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                        },
                        rules: {
                            '@fux/padding': ['error', {
                                patterns: [
                                    { blankLine: 'always', prev: 'setupTest', next: 'runTest' },
                                    { blankLine: 'always', prev: 'runTest', next: 'cleanupTest' }
                                ],
                                customMatchers: {
                                    setupTest: 'setupTest\\s*\\(',
                                    runTest: 'runTest\\s*\\(',
                                    cleanupTest: 'cleanupTest\\s*\\('
                                }
                            }]
                        },
                    }
                ],
            })

            const code = `
setupTest()
runTest()
cleanupTest()
            `

            const results = await eslint.lintText(code, {
                filePath: 'test.js',
            })

            const messages = results[0].messages
            expect(messages.length).toBeGreaterThan(0)
            expect(messages.every(msg => msg.ruleId === '@fux/padding')).toBe(true)
        })
    })
})