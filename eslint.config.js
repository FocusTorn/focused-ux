// IMPORTS ------------------------------------------------>>

// import antfuPlugin from 'eslint-plugin-antfu'

import seahaxWrapPlugin from '@seahax/eslint-plugin-wrap'
import nxPlugin from '@nx/eslint'

import eslintComments from 'eslint-plugin-eslint-comments'
import nPlugin from 'eslint-plugin-n'
// import jsdocPlugin from 'eslint-plugin-jsdoc'
import importPlugin from 'eslint-plugin-import'
import unicornPlugin from 'eslint-plugin-unicorn'
import stylisticPlugin from '@stylistic/eslint-plugin'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jsoncPlugin from 'eslint-plugin-jsonc'
import jsoncParser from 'jsonc-eslint-parser'
import markdownPlugin from '@eslint/markdown'
import ymlPlugin from 'eslint-plugin-yml'
import yamlParser from 'yaml-eslint-parser'
import tomlPlugin from 'eslint-plugin-toml'
import tomlParser from 'toml-eslint-parser'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'

// import foldingBracketsRule from './tools/eslint-rules/fux-format/folding-brackets/index.js'

//----------------------------------------------------------------------------<<

// RULE COMPOSITION --------------------------------------->>

// Base rules that apply everywhere (no plugin-specific rules)
const baseRules = { //>
    'license-header/header': 'off',
    'license/unknown': 'off',
    'no-console': 'off',
    'no-unused-vars': 'off',
    'antfu/curly': 'off',
    'space-in-parens': ['warn', 'never'],

    'unicorn/prefer-module': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'node/prefer-global/process': 'off',

    'comma-spacing': ['warn', { before: false, after: true }],
    'no-extra-semi': 'warn',
    'operator-linebreak': ['warn', 'before'],
} //<

// Plugin-specific rules for JS/TS files
const pluginRules = { //>
    'unused-imports/no-unused-vars': [
        'warn',
        {
            vars: 'all',
            varsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
        },
    ],
    'import/no-unresolved': 'off',
    'import/no-cycle': 'off',
    'import/extensions': 'off',
    'import/no-duplicates': 'warn',
    'import/order': 'off',
} //<

// Stylistic rules for code files
const stylisticRules = { //>
    'style/indent': ['warn', 4],
    'style/no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
    'style/no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 0 }],
    'style/no-trailing-spaces': ['warn', { skipBlankLines: true, ignoreComments: true }],
    'style/semi': ['warn', 'never'],
    'style/padded-blocks': [
        'warn',
        { blocks: 'always', classes: 'always' },
        { allowSingleLineBlocks: true },
    ],
    'style/padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
    ],

    // Array formatting
    'style/array-bracket-newline': ['warn', 'consistent'],
    'style/array-element-newline': ['warn', 'consistent'],

    // Object formatting
    'style/object-curly-newline': 'off',
    'style/object-property-newline': ['warn', { allowAllPropertiesOnSameLine: false }],

    // Function formatting
    'style/function-call-argument-newline': ['warn', 'consistent'],
    'style/function-paren-newline': ['warn', 'consistent'],

    'style/max-statements-per-line': 'off',
    'style/spaced-comment': 'off',
    'style/brace-style': 'off',
} //<

// Main JS-TS specific overrides (rules that were turned off in the original main block)
const mainJsTsOverrides = { //>
    'style/brace-style': 'off',
    'style/function-call-argument-newline': 'off',
    'style/function-paren-newline': 'off',
    'style/array-element-newline': 'off',
    'style/object-property-newline': 'off',
} //<

// JSON-specific stylistic overrides
// const jsonStylisticOverrides = { //>
//     'style/no-multiple-empty-lines': ['warn', { max: 2, maxBOF: 0, maxEOF: 0 }], // More lenient for JSON
//     'style/object-property-newline': 'off', // Allow properties on same line for JSON
// } //<

// TypeScript-specific rules
const tsRules = { //>
    'ts/no-explicit-any': 'error',
    'ts/explicit-function-return-type': 'off',
} //<

// Test-specific overrides
const testOverrides = { //>
    'import/no-cycle': 'off',
    'import/extensions': 'off',
    'ts/no-explicit-any': 'off',
    'ts/explicit-function-return-type': 'off',
    'ts/no-use-before-define': 'off',
    'no-console': 'off',
    'no-unused-expressions': 'off',
    'no-magic-numbers': 'off',
    'max-lines-per-function': 'off',
    'max-statements-per-line': 'off',
    'style/padding-line-between-statements': 'off',
    'style/no-multiple-empty-lines': 'off',
    'style/brace-style': 'off',
} //<

// Config file overrides
const configOverrides = { //>
    'ts/explicit-function-return-type': 'off',
    'ts/no-use-before-define': 'off',
    'import/no-unresolved': 'off',
    'style/padding-line-between-statements': 'off',
    'no-console': 'off',
} //<

// Function to merge rules with overrides (optimized for performance)
// function mergeRules(baseRules, overrides = {}) { //>

//     if (Object.keys(overrides).length === 0) return baseRules
//     return { ...baseRules, ...overrides }

// } //<

//----------------------------------------------------------------------------<<

export default [
    {   ignores: //>
        [
            '**/dist/**',
            '**/.nx/cache/**',
            '**/.eslintcache',
            '**/node_modules/**',
            '**/coverage/**',
            '**/.turbo/**',
            '**/.output/**',
            '**/_out-tsc/**',
            '**/build/**',
            '**/out/**',
            '**/*.md',
            '**/CHANGELOG.md',
            '**/README.md',
            'pnpm-lock.yaml',
            '**/package-lock.json',
            '**/yarn.lock',
            '**/*.lock',
            '**/.vscode-test/**',
            '**/__tests__/**/*.js',
            '**/cypress/videos/**',
            '**/cypress/screenshots/**',
            '**/.git/**',
            '**/tmp/**',
            '**/temp/**',
            '**/*.log',
            '**/generated/**',
            '**/*removed*/**/*',
            '**/*X_____*.*',
            '**/*X_____*/*.*',
            '**/*_____X*.*',
            '**/*_____X*/*.*',
            '**/*.model.*/**',
            '**/.next/**',
            '**/.nuxt/**',
            '**/.svelte-kit/**',
            '**/storybook-static/**',
            '**/.storybook/**',
            '**/vite.config.*.timestamp*',
            '**/vitest.config.*.timestamp*',
        ],
    }, //<

    {   name: 'fux/performance-settings', //>
        settings: {
            cache: true,
            cacheLocation: '.eslintcache',
            cacheStrategy: 'metadata',
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'warn',
        },
    }, //<

    {   name: 'fux/JS-TS', //>
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            style: stylisticPlugin,
            ts: tsPlugin,
            import: importPlugin,
            unicorn: unicornPlugin,
            'unused-imports': unusedImportsPlugin,
            '@seahax/wrap': seahaxWrapPlugin,
            '@nx': nxPlugin,
            eslintComments,
            node: nPlugin,
        },
        rules: {
            ...baseRules,
            ...pluginRules,
            ...stylisticRules,
            ...tsRules,
            ...mainJsTsOverrides,

            // Prevent require() usage in ESM files
            'ts/no-var-requires': 'error',
            'import/no-commonjs': 'error',
            'unicorn/prefer-module': 'error',
        },
        languageOptions: { //>
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        }, //<
    }, //<

    {   name: 'fux/custom-formatting-tweaks', //>
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            style: stylisticPlugin,
        },
        rules: {
            'style/function-paren-newline': ['warn', 'multiline-arguments'],
            'style/function-call-argument-newline': ['warn', 'consistent'],
            'style/arrow-spacing': ['warn', { before: true, after: true }],
        },
    }, //<

    {   name: 'fux/test-rules', //>
        files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts', '**/__tests__/**/*.ts'],
        plugins: {
            style: stylisticPlugin,
            ts: tsPlugin,
            import: importPlugin,
        },
        rules: {
            ...baseRules,
            ...pluginRules,
            ...stylisticRules,
            ...mainJsTsOverrides,
            ...testOverrides,
        },
        languageOptions: { //>
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                vi: 'readonly',
                jest: 'readonly',
                test: 'readonly',
                suite: 'readonly',
            },
        }, //<
    }, //<

    {   name: 'fux/shared-library', //>
        files: ['libs/shared/**/*.ts', 'libs/shared/**/*.tsx'],
        plugins: {
            ts: tsPlugin,
            style: stylisticPlugin,
            import: importPlugin,
        },
        rules: {
            ...baseRules,
            ...pluginRules,
            ...stylisticRules,
            ...tsRules,
            ...mainJsTsOverrides,
            'ts/no-use-before-define': 'off',
        },
        languageOptions: { //>
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        }, //<
    }, //<

    {   name: 'fux/markdown', //>
        files: ['**/*.md', '**/*.markdown'],
        plugins: {
            markdown: markdownPlugin,
        },
        rules: {
            'markdown/heading-style': ['warn', 'atx'],
            'markdown/no-inline-html': 'warn',
        },
    }, //<

    {   name: 'fux/yaml', //>
        files: ['**/*.{yml,yaml}'],
        plugins: { yml: ymlPlugin },
        rules: {},
        languageOptions: { //>
            parser: yamlParser,
        }, //<
    }, //<

    {   name: 'fux/toml', //>
        files: ['**/*.toml'],
        plugins: {
            toml: tomlPlugin,
        },
        rules: {
            'toml/indent': ['warn', 4],
        },
        languageOptions: { //>
            parser: tomlParser,
        }, //<
    }, //<

    {   name: 'fux/json', //>
        files: ['**/*.json', '**/*.jsonc'],
        plugins: {
            jsonc: jsoncPlugin,
            style: stylisticPlugin,
        },
        rules: {
            ...baseRules,
            ...stylisticRules,
            'jsonc/indent': ['warn', 4],
            'jsonc/comma-dangle': ['warn', 'never'],
            'jsonc/quotes': ['warn', 'double'],
            'jsonc/no-dupe-keys': 'error',
            'jsonc/valid-json-number': 'error',
            'jsonc/no-comments': 'off', // Allow comments in JSONC files
        },
        languageOptions: { //>
            parser: jsoncParser,
        }, //<
    }, //<
    
    {   name: 'fux/config-files', //>
        files: ['**/*.config.{js,ts,cjs,mjs}', '**/*.rc.{js,ts,cjs,mjs}'],
        plugins: {
            style: stylisticPlugin,
            ts: tsPlugin,
            import: importPlugin,
            node: nPlugin,
        },
        rules: {
            ...baseRules,
            ...pluginRules,
            ...stylisticRules,
            ...tsRules,
            ...mainJsTsOverrides,
            ...configOverrides,

            // Prevent require() usage in ESM files
            'ts/no-var-requires': 'error',
            'import/no-commonjs': 'error',
        },
        languageOptions: { //>
            parser: tsParser,
        }, //<
    }, //<
]
