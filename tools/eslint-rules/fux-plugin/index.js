import paddingRule from './rules/padding.js'
import foldingBracketsRule from './rules/folding-brackets.js'

/**
 * FocusedUX ESLint Plugin
 * 
 * Custom ESLint rules for the FocusedUX project
 */
export default {
    rules: {
        'padding': paddingRule,
        'folding-brackets': foldingBracketsRule,
    },
    
    configs: {
        recommended: {
            plugins: ['@fux'],
            rules: {
                '@fux/padding': 'error',
                '@fux/folding-brackets': 'error',
            },
        },
        
        'test-files': {
            plugins: ['@fux'],
            rules: {
                '@fux/padding': [
                    'error',
                    {
                        patterns: [
                            // Always blank line before describe blocks
                            { blankLine: 'always', prev: '*', next: 'describe' },
                            // Never blank line between describe and first it
                            { blankLine: 'never', prev: 'describe', next: 'it' },
                            // Never blank line between consecutive it blocks
                            { blankLine: 'never', prev: 'it', next: 'it' },
                            // Always blank line after describe blocks
                            { blankLine: 'always', prev: 'describe', next: '*' },
                            // Standard variable declaration spacing
                            { blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
                            { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
                            { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
                        ],
                    },
                ],
                '@fux/folding-brackets': 'error',
            },
        },
    },
}
