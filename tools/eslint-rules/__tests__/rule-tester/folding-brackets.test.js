import { RuleTester } from 'eslint'
import foldingBracketsRule from '../../fux-plugin/rules/folding-brackets.js'

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
})

ruleTester.run('@fux/folding-brackets', foldingBracketsRule, {
    valid: [
        // Correct folding markers
        'const obj = { //>\n    prop: "value"\n} //<',
        'if (condition) { //>\n    doSomething()\n} //<',
        'function test() { //>\n    return true\n} //<',
        
        // Single line blocks (should be allowed)
        'const obj = { prop: "value" }',
        'if (condition) doSomething()',
    ],
    invalid: [
        {
            code: 'const obj = {\n    prop: "value"\n}',
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        {
            code: 'if (condition) {\n    doSomething()\n}',
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
        {
            code: 'function test() {\n    return true\n}',
            errors: [{ messageId: 'missingFoldingMarkers' }],
        },
    ],
})
