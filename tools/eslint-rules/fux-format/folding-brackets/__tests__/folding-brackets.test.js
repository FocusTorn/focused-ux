import { RuleTester } from 'eslint'
import foldingBracketsRule from '../index.js'

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
})

ruleTester.run('folding-brackets', foldingBracketsRule, {
    valid: [
        // Single line format
        {
            code: '{ "key1": "value1", "key2": "value2", "key3": "value3" }',
            filename: 'test.json'
        },
        
        // Standard block format
        {
            code: `{
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`,
            filename: 'test.json'
        },
        
        // Correct folding format with 3 spaces in property context
        {
            code: `{
    "config": {   "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`,
            filename: 'test.json'
        },
        
        // Correct folding format with 1 space in assignment context
        {
            code: `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    } ]
}`,
            filename: 'test.json'
        }
    ],
    
    invalid: [
        // Should convert to single line format
        {
            code: `{ "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`,
            filename: 'test.json',
            errors: [{
                messageId: 'incorrectFormat',
                data: { format: 'single' }
            }],
            output: `{ "key1": "value1", "key2": "value2", "key3": "value3" }`
        },
        
        // Should convert to standard block format
        {
            code: `{ "key1": "value1", "key2": "value2",
    "key3": "value3"
}`,
            filename: 'test.json',
            errors: [{
                messageId: 'incorrectFormat',
                data: { format: 'standard' }
            }],
            output: `{
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}`
        },
        
        // Should fix folding format in property context (needs 3 spaces)
        {
            code: `{
    "config": { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`,
            filename: 'test.json',
            errors: [{
                messageId: 'incorrectFormat',
                data: { format: 'folding' }
            }],
            output: `{
    "config": {   "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    }
}`
        },
        
        // Should fix folding format in assignment context (needs 1 space)
        {
            code: `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    } ]
}`,
            filename: 'test.json',
            errors: [{
                messageId: 'incorrectFormat',
                data: { format: 'folding' }
            }],
            output: `{
    "plugins": [ { "plugin": "@nx/vite/plugin", //>
        "options": {
            "buildTargetName": "build"
        }
    } ]
}`
        }
    ]
})
