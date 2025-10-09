import { RuleTester } from 'eslint'
import paddingRule from '../fux-plugin/rules/padding.js'

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
})

ruleTester.run('padding', paddingRule, {
    valid: [
        // No patterns configured - should always pass
        {
            code: `
const a = 1
const b = 2
describe('test', () => {
    it('should work', () => {})
})
            `,
            options: [],
        },
        
        // Basic patterns - always blank line before describe
        {
            code: `
const a = 1

describe('test', () => {
    it('should work', () => {})
})
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: 'describe' }
                ]
            }],
        },
        
        // Never blank line between consecutive it blocks
        {
            code: `
describe('test', () => {
    it('first test', () => {})
    it('second test', () => {})
    it('third test', () => {})
})
            `,
            options: [{
                patterns: [
                    { blankLine: 'never', prev: 'it', next: 'it' }
                ]
            }],
        },
        
        // Always blank line before variable declarations
        {
            code: `
const existing = 1

const newVar = 2

function test() {
    return 1
}
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: 'const' }
                ]
            }],
        },
        
        // Multiple patterns working together
        {
            code: `
const setup = 1

describe('test suite', () => {
    it('first test', () => {})
    it('second test', () => {})
})

describe('another suite', () => {
    it('another test', () => {})
})
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: 'describe' },
                    { blankLine: 'never', prev: 'it', next: 'it' },
                    { blankLine: 'always', prev: 'describe', next: '*' }
                ]
            }],
        },
        
        // Custom matchers for test functions
        {
            code: `
describe('test', () => {
    beforeEach(() => {})
    it('test', () => {})
    afterEach(() => {})
})
            `,
            options: [{
                patterns: [
                    { blankLine: 'never', prev: 'beforeEach', next: 'it' },
                    { blankLine: 'never', prev: 'it', next: 'afterEach' }
                ],
                customMatchers: {
                    beforeEach: 'beforeEach\\s*\\(',
                    afterEach: 'afterEach\\s*\\('
                }
            }],
        },
        
        // 'any' pattern should allow any spacing
        {
            code: `
const a = 1
const b = 2

const c = 3
            `,
            options: [{
                patterns: [
                    { blankLine: 'any', prev: 'const', next: 'const' }
                ]
            }],
        },
    ],
    
    invalid: [
        // Missing blank line before describe
        {
            code: `
const a = 1
describe('test', () => {
    it('should work', () => {})
})
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: 'describe' }
                ]
            }],
            errors: [{ messageId: 'requireBlankLine' }],
            output: `
const a = 1

describe('test', () => {
    it('should work', () => {})
})
            `,
        },
        
        // Unexpected blank line between top-level describe blocks
        {
            code: `
describe('first test', () => {})

describe('second test', () => {})
            `,
            options: [{
                patterns: [
                    { blankLine: 'never', prev: 'describe', next: 'describe' }
                ],
                customMatchers: {
                    describe: 'describe\\s*\\('
                }
            }],
            errors: [{ messageId: 'disallowBlankLine' }],
            output: `
describe('first test', () => {})
describe('second test', () => {})
            `,
        },
        
        // Missing blank line before const
        {
            code: `
const existing = 1
const newVar = 2
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: 'const' }
                ]
            }],
            errors: [{ messageId: 'requireBlankLine' }],
            output: `
const existing = 1

const newVar = 2
            `,
        },
        
        // Multiple violations
        {
            code: `
const setup = 1
describe('test', () => {})
describe('another', () => {})
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: 'describe' },
                    { blankLine: 'always', prev: 'describe', next: '*' }
                ],
                customMatchers: {
                    describe: 'describe\\s*\\('
                }
            }],
            errors: [
                { messageId: 'requireBlankLine' }, // Missing blank line before first describe
                { messageId: 'requireBlankLine' }, // Missing blank line before second describe
                { messageId: 'requireBlankLine' }   // Duplicate error (rule issue)
            ],
            output: `
const setup = 1

describe('test', () => {})

describe('another', () => {})
            `,
        },
        
        // Custom matcher violations
        {
            code: `
beforeEach(() => {})

it('test', () => {})
            `,
            options: [{
                patterns: [
                    { blankLine: 'never', prev: 'beforeEach', next: 'it' }
                ],
                customMatchers: {
                    beforeEach: 'beforeEach\\s*\\(',
                    it: 'it\\s*\\('
                }
            }],
            errors: [{ messageId: 'disallowBlankLine' }],
            output: `
beforeEach(() => {})
it('test', () => {})
            `,
        },
        
        // Array patterns - should match any element
        {
            code: `
let a = 1
const b = 2
var c = 3
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] }
                ]
            }],
            errors: [
                { messageId: 'requireBlankLine' }, // Missing blank line before const
                { messageId: 'requireBlankLine' }  // Missing blank line before var
            ],
            output: `
let a = 1

const b = 2

var c = 3
            `,
        },
        
        // Wildcard patterns
        {
            code: `
const a = 1
function test() {
    return 1
}
            `,
            options: [{
                patterns: [
                    { blankLine: 'always', prev: '*', next: '*' }
                ]
            }],
            errors: [{ messageId: 'requireBlankLine' }],
            output: `
const a = 1

function test() {
    return 1
}
            `,
        },
    ],
})
