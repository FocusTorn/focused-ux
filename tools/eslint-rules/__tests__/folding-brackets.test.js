import { RuleTester } from 'eslint'
import foldingBracketsRule from '../fux-plugin/rules/folding-brackets.js'

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
})

ruleTester.run('folding-brackets', foldingBracketsRule, {
    valid: [
        // Single line blocks - should always pass
        {
            code: 'const obj = { a: 1, b: 2 }',
        },
        {
            code: 'const arr = [1, 2, 3]',
        },
        {
            code: 'function test() { if (true) { return 1 } }',
        },
        {
            code: 'function test() { return 1 }',
        },
        
        // Multi-line blocks with correct folding markers
        {
            code: `
const obj = { //>
    a: 1,
    b: 2
} //<
            `,
        },
        {
            code: `
const arr = [ //>
    1,
    2,
    3
] //<
            `,
        },
        {
            code: `
function test() { //>
    if (true) {
        return 1
    }
} //<
            `,
        },
        {
            code: `
function test() { //>
    return 1
} //<
            `,
        },
        
        // Block statements with folding markers
        {
            code: `
{ //>
    const a = 1
    const b = 2
} //<
            `,
        },
        
        // Arrow functions with folding markers
        {
            code: `
const fn = () => { //>
    return 1
} //<
            `,
        },
        
        // Empty blocks should pass
        {
            code: 'const obj = {}',
        },
        {
            code: 'const arr = []',
        },
        
        // Nested objects/arrays should be ignored (not top-level)
        {
            code: `
const obj = { //>
    nested: {
        a: 1,
        b: 2
    },
    arr: [1, 2, 3]
} //<
            `,
        },
    ],
    
    invalid: [
        // Multi-line blocks missing opening marker
        {
            code: `
const obj = {
    a: 1,
    b: 2
} //<
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // Multi-line blocks missing closing marker
        {
            code: `
const obj = { //>
    a: 1,
    b: 2
}
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // Multi-line blocks missing both markers
        {
            code: `
const obj = {
    a: 1,
    b: 2
}
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // Array with missing markers
        {
            code: `
const arr = [
    1,
    2,
    3
]
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // Function with missing markers
        {
            code: `
function test() {
    return 1
}
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // Arrow function with missing markers
        {
            code: `
const fn = () => {
    return 1
}
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // If statement with missing markers
        {
            code: `
function test() {
    if (true) {
        return 1
    }
}
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // Block statement with missing markers
        {
            code: `
{
    const a = 1
    const b = 2
}
            `,
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        
        // Multiple violations in same file
        {
            code: `
const obj = {
    a: 1
}

function test() {
    return 1
}
            `,
            errors: [
                { messageId: 'missingFoldingMarkers' },
                { messageId: 'missingFoldingMarkers' }
            ],
        },
    ],
})
