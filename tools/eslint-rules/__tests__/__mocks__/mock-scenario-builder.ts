import { ESLint } from 'eslint'
import foldingBracketsRule from '../../fux-plugin/rules/folding-brackets.js'
import paddingRule from '../../fux-plugin/rules/padding.js'
import type { EslintRulesTestMocks } from './helpers.js'

export interface FoldingBracketsScenarioOptions {
    code: string
    shouldPass?: boolean
    expectedFormat?: 'single' | 'standard' | 'folding'
    filePath?: string
}

export interface PaddingScenarioOptions {
    code: string
    shouldPass?: boolean
    patterns?: Array<{
        blankLine: 'always' | 'never' | 'any'
        prev: string | string[]
        next: string | string[]
    }>
    customMatchers?: Record<string, string>
    filePath?: string
}

export class EslintRulesMockBuilder {
    constructor(private mocks: EslintRulesTestMocks) {}

    foldingBrackets(): FoldingBracketsScenarioBuilder {
        return new FoldingBracketsScenarioBuilder(this.mocks)
    }

    padding(): PaddingScenarioBuilder {
        return new PaddingScenarioBuilder(this.mocks)
    }
}

export class FoldingBracketsScenarioBuilder {
    constructor(private mocks: EslintRulesTestMocks) {}

    withCode(code: string): FoldingBracketsScenarioBuilder {
        this.code = code
        return this
    }

    shouldPass(): FoldingBracketsScenarioBuilder {
        this.shouldPassFlag = true
        return this
    }

    shouldFail(expectedFormat: 'single' | 'standard' | 'folding'): FoldingBracketsScenarioBuilder {
        this.shouldPassFlag = false
        this.expectedFormat = expectedFormat
        return this
    }

    withFile(filePath: string): FoldingBracketsScenarioBuilder {
        this.filePath = filePath
        return this
    }

    build(): ESLint {
        return new ESLint({
            cwd: process.cwd(), // Use current working directory
            baseConfig: [{
                rules: {
                    'test-folding-brackets/folding-brackets': 'error',
                    // Explicitly disable ALL possible rules to prevent workspace interference
                    'no-unused-vars': 'off',
                    'no-undef': 'off',
                    'unused-imports/no-unused-vars': 'off',
                    'no-unreachable': 'off',
                    'no-constant-condition': 'off',
                    'no-dupe-keys': 'off',
                    'no-empty': 'off',
                    'no-extra-semi': 'off',
                    'no-irregular-whitespace': 'off',
                    'no-unexpected-multiline': 'off',
                    'valid-typeof': 'off',
                    'no-console': 'off',
                    'no-debugger': 'off',
                    'no-alert': 'off',
                    'no-caller': 'off',
                    'no-eval': 'off',
                    'no-extend-native': 'off',
                    'no-extra-bind': 'off',
                    'no-fallthrough': 'off',
                    'no-floating-decimal': 'off',
                    'no-implied-eval': 'off',
                    'no-lone-blocks': 'off',
                    'no-loop-func': 'off',
                    'no-multi-spaces': 'off',
                    'no-multi-str': 'off',
                    'no-new': 'off',
                    'no-new-func': 'off',
                    'no-new-wrappers': 'off',
                    'no-octal': 'off',
                    'no-octal-escape': 'off',
                    'no-proto': 'off',
                    'no-redeclare': 'off',
                    'no-return-assign': 'off',
                    'no-script-url': 'off',
                    'no-self-compare': 'off',
                    'no-sequences': 'off',
                    'no-throw-literal': 'off',
                    'no-with': 'off',
                    'radix': 'off',
                    'vars-on-top': 'off',
                    'wrap-iife': 'off',
                    'yoda': 'off',
                    // Disable TypeScript-specific rules
                    '@typescript-eslint/no-unused-vars': 'off',
                    '@typescript-eslint/no-explicit-any': 'off',
                    '@typescript-eslint/no-non-null-assertion': 'off',
                    '@typescript-eslint/prefer-as-const': 'off',
                    '@typescript-eslint/no-inferrable-types': 'off',
                    '@typescript-eslint/no-empty-function': 'off',
                    '@typescript-eslint/no-empty-interface': 'off',
                    '@typescript-eslint/no-namespace': 'off',
                    '@typescript-eslint/no-var-requires': 'off',
                    '@typescript-eslint/ban-ts-comment': 'off',
                    '@typescript-eslint/ban-types': 'off',
                    '@typescript-eslint/explicit-function-return-type': 'off',
                    '@typescript-eslint/explicit-module-boundary-types': 'off',
                    '@typescript-eslint/no-extra-non-null-assertion': 'off',
                    '@typescript-eslint/no-misused-new': 'off',
                    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
                    '@typescript-eslint/no-this-alias': 'off',
                    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
                    '@typescript-eslint/no-unsafe-assignment': 'off',
                    '@typescript-eslint/no-unsafe-call': 'off',
                    '@typescript-eslint/no-unsafe-member-access': 'off',
                    '@typescript-eslint/no-unsafe-return': 'off',
                    '@typescript-eslint/prefer-regexp-exec': 'off',
                    '@typescript-eslint/require-await': 'off',
                    '@typescript-eslint/restrict-plus-operands': 'off',
                    '@typescript-eslint/restrict-template-expressions': 'off',
                    '@typescript-eslint/unbound-method': 'off',
                    // Disable more TypeScript-specific rules
                    '@typescript-eslint/no-unnecessary-condition': 'off',
                    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
                    '@typescript-eslint/no-useless-constructor': 'off',
                    '@typescript-eslint/no-useless-empty-export': 'off',
                    '@typescript-eslint/prefer-function-type': 'off',
                    '@typescript-eslint/prefer-includes': 'off',
                    '@typescript-eslint/prefer-nullish-coalescing': 'off',
                    '@typescript-eslint/prefer-optional-chain': 'off',
                    '@typescript-eslint/prefer-readonly': 'off',
                    '@typescript-eslint/prefer-string-starts-ends-with': 'off',
                    '@typescript-eslint/prefer-ts-expect-error': 'off',
                    '@typescript-eslint/promise-function-async': 'off',
                    '@typescript-eslint/require-array-sort-compare': 'off',
                    '@typescript-eslint/return-await': 'off',
                    '@typescript-eslint/sort-type-union-intersection-members': 'off',
                    '@typescript-eslint/switch-exhaustiveness-check': 'off',
                    '@typescript-eslint/triple-slash-reference': 'off',
                    '@typescript-eslint/type-annotation-spacing': 'off',
                    '@typescript-eslint/typedef': 'off',
                    '@typescript-eslint/unified-signatures': 'off',
                    // Disable more general ESLint rules
                    'no-array-constructor': 'off',
                    'no-async-promise-executor': 'off',
                    'no-await-in-loop': 'off',
                    'no-bitwise': 'off',
                    'no-case-declarations': 'off',
                    'no-class-assign': 'off',
                    'no-compare-neg-zero': 'off',
                    'no-cond-assign': 'off',
                    'no-confusing-arrow': 'off',
                    'no-const-assign': 'off',
                    'no-constructor-return': 'off',
                    'no-continue': 'off',
                    'no-control-regex': 'off',
                    'no-div-regex': 'off',
                    'no-dupe-args': 'off',
                    'no-dupe-class-members': 'off',
                    'no-dupe-else-if': 'off',
                    'no-duplicate-case': 'off',
                    'no-duplicate-imports': 'off',
                    'no-empty-character-class': 'off',
                    'no-empty-pattern': 'off',
                    'no-ex-assign': 'off',
                    'no-func-assign': 'off',
                    'no-global-assign': 'off',
                    'no-import-assign': 'off',
                    'no-inner-declarations': 'off',
                    'no-invalid-regexp': 'off',
                    'no-invalid-this': 'off',
                    'no-isolate-declarations': 'off',
                    'no-label-var': 'off',
                    'no-labels': 'off',
                    'no-lonely-if': 'off',
                    'no-loss-of-precision': 'off',
                    'no-magic-numbers': 'off',
                    'no-misleading-character-class': 'off',
                    'no-mixed-operators': 'off',
                    'no-mixed-requires': 'off',
                    'no-mixed-spaces-and-tabs': 'off',
                    'no-named-as-default': 'off',
                    'no-named-as-default-member': 'off',
                    'no-negated-condition': 'off',
                    'no-negated-in-lhs': 'off',
                    'no-nested-ternary': 'off',
                    'no-new-object': 'off',
                    'no-new-require': 'off',
                    'no-new-symbol': 'off',
                    'no-obj-calls': 'off',
                    'no-param-reassign': 'off',
                    'no-path-concat': 'off',
                    'no-plusplus': 'off',
                    'no-process-env': 'off',
                    'no-process-exit': 'off',
                    'no-promise-executor-return': 'off',
                    'no-prototype-builtins': 'off',
                    'no-restricted-exports': 'off',
                    'no-restricted-globals': 'off',
                    'no-restricted-imports': 'off',
                    'no-restricted-modules': 'off',
                    'no-restricted-properties': 'off',
                    'no-restricted-syntax': 'off',
                    'no-shadow': 'off',
                    'no-shadow-restricted-names': 'off',
                    'no-sparse-arrays': 'off',
                    'no-sync': 'off',
                    'no-tabs': 'off',
                    'no-template-curly-in-string': 'off',
                    'no-ternary': 'off',
                    'no-trailing-spaces': 'off',
                    'no-unmodified-loop-condition': 'off',
                    'no-unneeded-ternary': 'off',
                    'no-unsafe-finally': 'off',
                    'no-unsafe-negation': 'off',
                    'no-unused-expressions': 'off',
                    'no-unused-labels': 'off',
                    'no-use-before-define': 'off',
                    'no-useless-call': 'off',
                    'no-useless-catch': 'off',
                    'no-useless-computed-key': 'off',
                    'no-useless-concat': 'off',
                    'no-useless-constructor': 'off',
                    'no-useless-escape': 'off',
                    'no-useless-rename': 'off',
                    'no-useless-return': 'off',
                    'no-var': 'off',
                    'no-void': 'off',
                    'no-warning-comments': 'off',
                    'no-whitespace-before-property': 'off',
                    'object-curly-newline': 'off',
                    'object-curly-spacing': 'off',
                    'object-property-newline': 'off',
                    'object-shorthand': 'off',
                    'one-var': 'off',
                    'one-var-declaration-per-line': 'off',
                    'operator-assignment': 'off',
                    'operator-linebreak': 'off',
                    'padded-blocks': 'off',
                    'prefer-arrow-callback': 'off',
                    'prefer-const': 'off',
                    'prefer-destructuring': 'off',
                    'prefer-exponentiation-operator': 'off',
                    'prefer-named-capture-group': 'off',
                    'prefer-numeric-literals': 'off',
                    'prefer-object-spread': 'off',
                    'prefer-promise-reject-errors': 'off',
                    'prefer-reflect': 'off',
                    'prefer-regex-literals': 'off',
                    'prefer-rest-params': 'off',
                    'prefer-spread': 'off',
                    'prefer-template': 'off',
                    'quote-props': 'off',
                    'quotes': 'off',
                    'require-atomic-updates': 'off',
                    'require-await': 'off',
                    'require-jsdoc': 'off',
                    'require-unicode-regexp': 'off',
                    'semi': 'off',
                    'semi-spacing': 'off',
                    'semi-style': 'off',
                    'sort-imports': 'off',
                    'sort-keys': 'off',
                    'sort-vars': 'off',
                    'space-before-blocks': 'off',
                    'space-before-function-paren': 'off',
                    'space-in-parens': 'off',
                    'space-infix-ops': 'off',
                    'space-unary-ops': 'off',
                    'spaced-comment': 'off',
                    'strict': 'off',
                    'switch-colon-spacing': 'off',
                    'symbol-description': 'off',
                    'template-curly-spacing': 'off',
                    'template-tag-spacing': 'off',
                    'unicode-bom': 'off',
                    'use-isnan': 'off',
                    'valid-jsdoc': 'off',
                    'wrap-regex': 'off',
                    'yield-star-spacing': 'off',
                },
                plugins: {
                    'test-folding-brackets': { rules: { 'folding-brackets': foldingBracketsRule } }
                },
                languageOptions: {
                    parser: require('@typescript-eslint/parser'),
                    ecmaVersion: 2020,
                    sourceType: 'module',
                    globals: {
                        console: 'readonly',
                        process: 'readonly',
                        Buffer: 'readonly',
                        __dirname: 'readonly',
                        __filename: 'readonly',
                        global: 'readonly',
                        module: 'readonly',
                        require: 'readonly',
                        exports: 'readonly',
                    },
                },
            }],
            fix: true,
            ignore: false, // Don't ignore any files
        })
    }

    private code: string = ''
    private shouldPassFlag: boolean = false
    private expectedFormat?: 'single' | 'standard' | 'folding'
    private filePath: string = 'test.json'
}

export class PaddingScenarioBuilder {
    constructor(private mocks: EslintRulesTestMocks) {}

    withCode(code: string): PaddingScenarioBuilder {
        this.code = code
        return this
    }

    shouldPass(): PaddingScenarioBuilder {
        this.shouldPassFlag = true
        return this
    }

    shouldFail(): PaddingScenarioBuilder {
        this.shouldPassFlag = false
        return this
    }

    withPatterns(patterns: Array<{
        blankLine: 'always' | 'never' | 'any'
        prev: string | string[]
        next: string | string[]
    }>): PaddingScenarioBuilder {
        this.patterns = patterns
        return this
    }

    withCustomMatchers(customMatchers: Record<string, string>): PaddingScenarioBuilder {
        this.customMatchers = customMatchers
        return this
    }

    withFile(filePath: string): PaddingScenarioBuilder {
        this.filePath = filePath
        return this
    }

    build(): ESLint {
        const options: any = {}
        if (this.patterns) {
            options.patterns = this.patterns
        }
        if (this.customMatchers) {
            options.customMatchers = this.customMatchers
        }

        return new ESLint({
            baseConfig: [{
                rules: {
                    'test-padding/padding': ['error', options],
                    // Explicitly disable ALL possible rules to prevent workspace interference
                    'no-unused-vars': 'off',
                    'no-undef': 'off',
                    'unused-imports/no-unused-vars': 'off',
                    'no-unreachable': 'off',
                    'no-constant-condition': 'off',
                    'no-dupe-keys': 'off',
                    'no-empty': 'off',
                    'no-extra-semi': 'off',
                    'no-irregular-whitespace': 'off',
                    'no-unexpected-multiline': 'off',
                    'valid-typeof': 'off',
                    'no-console': 'off',
                    'no-debugger': 'off',
                    'no-alert': 'off',
                    'no-caller': 'off',
                    'no-eval': 'off',
                    'no-extend-native': 'off',
                    'no-extra-bind': 'off',
                    'no-fallthrough': 'off',
                    'no-floating-decimal': 'off',
                    'no-implied-eval': 'off',
                    'no-lone-blocks': 'off',
                    'no-loop-func': 'off',
                    'no-multi-spaces': 'off',
                    'no-multi-str': 'off',
                    'no-new': 'off',
                    'no-new-func': 'off',
                    'no-new-wrappers': 'off',
                    'no-octal': 'off',
                    'no-octal-escape': 'off',
                    'no-proto': 'off',
                    'no-redeclare': 'off',
                    'no-return-assign': 'off',
                    'no-script-url': 'off',
                    'no-self-compare': 'off',
                    'no-sequences': 'off',
                    'no-throw-literal': 'off',
                    'no-with': 'off',
                    'radix': 'off',
                    'vars-on-top': 'off',
                    'wrap-iife': 'off',
                    'yoda': 'off',
                    // Disable TypeScript-specific rules
                    '@typescript-eslint/no-unused-vars': 'off',
                    '@typescript-eslint/no-explicit-any': 'off',
                    '@typescript-eslint/no-non-null-assertion': 'off',
                    '@typescript-eslint/prefer-as-const': 'off',
                    '@typescript-eslint/no-inferrable-types': 'off',
                    '@typescript-eslint/no-empty-function': 'off',
                    '@typescript-eslint/no-empty-interface': 'off',
                    '@typescript-eslint/no-namespace': 'off',
                    '@typescript-eslint/no-var-requires': 'off',
                    '@typescript-eslint/ban-ts-comment': 'off',
                    '@typescript-eslint/ban-types': 'off',
                    '@typescript-eslint/explicit-function-return-type': 'off',
                    '@typescript-eslint/explicit-module-boundary-types': 'off',
                    '@typescript-eslint/no-extra-non-null-assertion': 'off',
                    '@typescript-eslint/no-misused-new': 'off',
                    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
                    '@typescript-eslint/no-this-alias': 'off',
                    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
                    '@typescript-eslint/no-unsafe-assignment': 'off',
                    '@typescript-eslint/no-unsafe-call': 'off',
                    '@typescript-eslint/no-unsafe-member-access': 'off',
                    '@typescript-eslint/no-unsafe-return': 'off',
                    '@typescript-eslint/prefer-regexp-exec': 'off',
                    '@typescript-eslint/require-await': 'off',
                    '@typescript-eslint/restrict-plus-operands': 'off',
                    '@typescript-eslint/restrict-template-expressions': 'off',
                    '@typescript-eslint/unbound-method': 'off',
                    // Disable more TypeScript-specific rules
                    '@typescript-eslint/no-unnecessary-condition': 'off',
                    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
                    '@typescript-eslint/no-useless-constructor': 'off',
                    '@typescript-eslint/no-useless-empty-export': 'off',
                    '@typescript-eslint/prefer-function-type': 'off',
                    '@typescript-eslint/prefer-includes': 'off',
                    '@typescript-eslint/prefer-nullish-coalescing': 'off',
                    '@typescript-eslint/prefer-optional-chain': 'off',
                    '@typescript-eslint/prefer-readonly': 'off',
                    '@typescript-eslint/prefer-string-starts-ends-with': 'off',
                    '@typescript-eslint/prefer-ts-expect-error': 'off',
                    '@typescript-eslint/promise-function-async': 'off',
                    '@typescript-eslint/require-array-sort-compare': 'off',
                    '@typescript-eslint/return-await': 'off',
                    '@typescript-eslint/sort-type-union-intersection-members': 'off',
                    '@typescript-eslint/switch-exhaustiveness-check': 'off',
                    '@typescript-eslint/triple-slash-reference': 'off',
                    '@typescript-eslint/type-annotation-spacing': 'off',
                    '@typescript-eslint/typedef': 'off',
                    '@typescript-eslint/unified-signatures': 'off',
                    // Disable more general ESLint rules
                    'no-array-constructor': 'off',
                    'no-async-promise-executor': 'off',
                    'no-await-in-loop': 'off',
                    'no-bitwise': 'off',
                    'no-case-declarations': 'off',
                    'no-class-assign': 'off',
                    'no-compare-neg-zero': 'off',
                    'no-cond-assign': 'off',
                    'no-confusing-arrow': 'off',
                    'no-const-assign': 'off',
                    'no-constructor-return': 'off',
                    'no-continue': 'off',
                    'no-control-regex': 'off',
                    'no-div-regex': 'off',
                    'no-dupe-args': 'off',
                    'no-dupe-class-members': 'off',
                    'no-dupe-else-if': 'off',
                    'no-duplicate-case': 'off',
                    'no-duplicate-imports': 'off',
                    'no-empty-character-class': 'off',
                    'no-empty-pattern': 'off',
                    'no-ex-assign': 'off',
                    'no-func-assign': 'off',
                    'no-global-assign': 'off',
                    'no-import-assign': 'off',
                    'no-inner-declarations': 'off',
                    'no-invalid-regexp': 'off',
                    'no-invalid-this': 'off',
                    'no-isolate-declarations': 'off',
                    'no-label-var': 'off',
                    'no-labels': 'off',
                    'no-lonely-if': 'off',
                    'no-loss-of-precision': 'off',
                    'no-magic-numbers': 'off',
                    'no-misleading-character-class': 'off',
                    'no-mixed-operators': 'off',
                    'no-mixed-requires': 'off',
                    'no-mixed-spaces-and-tabs': 'off',
                    'no-named-as-default': 'off',
                    'no-named-as-default-member': 'off',
                    'no-negated-condition': 'off',
                    'no-negated-in-lhs': 'off',
                    'no-nested-ternary': 'off',
                    'no-new-object': 'off',
                    'no-new-require': 'off',
                    'no-new-symbol': 'off',
                    'no-obj-calls': 'off',
                    'no-param-reassign': 'off',
                    'no-path-concat': 'off',
                    'no-plusplus': 'off',
                    'no-process-env': 'off',
                    'no-process-exit': 'off',
                    'no-promise-executor-return': 'off',
                    'no-prototype-builtins': 'off',
                    'no-restricted-exports': 'off',
                    'no-restricted-globals': 'off',
                    'no-restricted-imports': 'off',
                    'no-restricted-modules': 'off',
                    'no-restricted-properties': 'off',
                    'no-restricted-syntax': 'off',
                    'no-shadow': 'off',
                    'no-shadow-restricted-names': 'off',
                    'no-sparse-arrays': 'off',
                    'no-sync': 'off',
                    'no-tabs': 'off',
                    'no-template-curly-in-string': 'off',
                    'no-ternary': 'off',
                    'no-trailing-spaces': 'off',
                    'no-unmodified-loop-condition': 'off',
                    'no-unneeded-ternary': 'off',
                    'no-unsafe-finally': 'off',
                    'no-unsafe-negation': 'off',
                    'no-unused-expressions': 'off',
                    'no-unused-labels': 'off',
                    'no-use-before-define': 'off',
                    'no-useless-call': 'off',
                    'no-useless-catch': 'off',
                    'no-useless-computed-key': 'off',
                    'no-useless-concat': 'off',
                    'no-useless-constructor': 'off',
                    'no-useless-escape': 'off',
                    'no-useless-rename': 'off',
                    'no-useless-return': 'off',
                    'no-var': 'off',
                    'no-void': 'off',
                    'no-warning-comments': 'off',
                    'no-whitespace-before-property': 'off',
                    'object-curly-newline': 'off',
                    'object-curly-spacing': 'off',
                    'object-property-newline': 'off',
                    'object-shorthand': 'off',
                    'one-var': 'off',
                    'one-var-declaration-per-line': 'off',
                    'operator-assignment': 'off',
                    'operator-linebreak': 'off',
                    'padded-blocks': 'off',
                    'prefer-arrow-callback': 'off',
                    'prefer-const': 'off',
                    'prefer-destructuring': 'off',
                    'prefer-exponentiation-operator': 'off',
                    'prefer-named-capture-group': 'off',
                    'prefer-numeric-literals': 'off',
                    'prefer-object-spread': 'off',
                    'prefer-promise-reject-errors': 'off',
                    'prefer-reflect': 'off',
                    'prefer-regex-literals': 'off',
                    'prefer-rest-params': 'off',
                    'prefer-spread': 'off',
                    'prefer-template': 'off',
                    'quote-props': 'off',
                    'quotes': 'off',
                    'require-atomic-updates': 'off',
                    'require-await': 'off',
                    'require-jsdoc': 'off',
                    'require-unicode-regexp': 'off',
                    'semi': 'off',
                    'semi-spacing': 'off',
                    'semi-style': 'off',
                    'sort-imports': 'off',
                    'sort-keys': 'off',
                    'sort-vars': 'off',
                    'space-before-blocks': 'off',
                    'space-before-function-paren': 'off',
                    'space-in-parens': 'off',
                    'space-infix-ops': 'off',
                    'space-unary-ops': 'off',
                    'spaced-comment': 'off',
                    'strict': 'off',
                    'switch-colon-spacing': 'off',
                    'symbol-description': 'off',
                    'template-curly-spacing': 'off',
                    'template-tag-spacing': 'off',
                    'unicode-bom': 'off',
                    'use-isnan': 'off',
                    'valid-jsdoc': 'off',
                    'wrap-regex': 'off',
                    'yield-star-spacing': 'off',
                },
                plugins: {
                    'test-padding': { rules: { 'padding': paddingRule } }
                },
                languageOptions: {
                    parser: require('@typescript-eslint/parser'),
                    ecmaVersion: 2020,
                    sourceType: 'module',
                    globals: {
                        console: 'readonly',
                        process: 'readonly',
                        Buffer: 'readonly',
                        __dirname: 'readonly',
                        __filename: 'readonly',
                        global: 'readonly',
                        module: 'readonly',
                        require: 'readonly',
                        exports: 'readonly',
                    },
                },
            }],
            fix: true,
            ignore: false, // Don't ignore any files
        })
    }

    private code: string = ''
    private shouldPassFlag: boolean = false
    private patterns?: Array<{
        blankLine: 'always' | 'never' | 'any'
        prev: string | string[]
        next: string | string[]
    }>
    private customMatchers?: Record<string, string>
    private filePath: string = 'test.js'
}

export function createEslintRulesMockBuilder(mocks: EslintRulesTestMocks): EslintRulesMockBuilder {
    return new EslintRulesMockBuilder(mocks)
}

// Legacy function for backward compatibility
export function setupFoldingBracketsScenario(mocks: any, options: { code: string, expected?: string }) {
    return new ESLint({
        baseConfig: [{
            rules: {
                'folding-brackets/folding-brackets': 'error',
            },
            plugins: {
                'folding-brackets': { rules: { 'folding-brackets': foldingBracketsRule } }
            },
            languageOptions: {
                parser: require('@typescript-eslint/parser'),
                ecmaVersion: 2020,
                sourceType: 'module',
            },
        }],
        fix: true,
    })
}
