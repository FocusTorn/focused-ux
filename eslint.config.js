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

import fuxFormat from './.eslint/plugins/fux-format/index.js'

//----------------------------------------------------------------------------<<

const focusTornBaseRules = { //>
	'license-header/header': 'off',
	'license/unknown': 'off',
	'no-console': 'off',
	'no-unused-vars': 'off',
	'antfu/curly': 'off',
	'space-in-parens': ['warn', 'never'],

	'unicorn/prefer-module': 'off',
	'unicorn/prefer-node-protocol': 'off',
	'node/prefer-global/process': 'off',
	'antfu/consistent-list-newline': 'off',

	'comma-spacing': ['warn', { before: false, after: true }],
	'no-extra-semi': 'warn',
	'operator-linebreak': ['warn', 'before'],
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

	'ts/no-explicit-any': 'warn',

	'style/implicit-arrow-linebreak': ['warn', 'beside'],
	'style/max-statements-per-line': 'off',
	'style/no-tabs': 'off',
	'style/spaced-comment': 'off',
	'style/indent': ['warn', 'tab'],
	'style/no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
	'style/no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 0 }],
	'style/no-trailing-spaces': ['warn', { skipBlankLines: true, ignoreComments: true }],
	'style/semi': ['warn', 'never'],
	'style/padded-blocks': [
		'warn',
		{ blocks: 'never', classes: 'always' },
		{ allowSingleLineBlocks: true },
	],
	'style/padding-line-between-statements': [
		'warn',
		{ blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
		{ blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
		{ blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
	],

	'style/brace-style': 'off',
	'style/function-call-argument-newline': 'off',
	'style/function-paren-newline': 'off',
	'style/array-element-newline': 'off',
	'style/object-property-newline': 'off',

	'import/no-unresolved': 'off',
	'import/no-cycle': 'off',
	'import/extensions': 'off',
	'import/no-duplicates': 'warn',
	'import/order': 'off',

	'ts/explicit-function-return-type': 'off',
} //<

export default [
	// Performance optimizations
	{   name: 'performance/cache', //>
		settings: {
			cache: true,
			cacheLocation: '.eslintcache',
			cacheStrategy: 'content'
		}
	}, //<
    
	{   ignores: [ //>
        
		'**/*.md',
        
		'**/dist/**',
		'**/.output/**',
		'**/_out-tsc/**',
		'**/coverage/**',
		'**/.turbo/**',
		'**/node_modules/**',
		'pnpm-lock.yaml',
		'**/package-lock.json',
		'**/yarn.lock',
		'**/CHANGELOG.md',
		'**/README.md',
		'**/.eslintcache',
		'**/.nx/cache/**',
		'**/.vscode-test/**',
		'**/__tests__/**/*.js',
		'**/*.model.*/**',
		'**/*removed*/**/*',
		'**/*X_____*.*',
		'**/*X_____*/*.*',
		'**/*_____X*.*',
		'**/*_____X*/*.*',
		'**/.git/**',
		// '**/.vscode/**',
		'**/tmp/**',
		'**/temp/**',
		'**/*.log',
		'**/*.lock',
		'**/generated/**',
		'**/build/**',
		'**/out/**',
		'**/.next/**',
		'**/.nuxt/**',
		'**/.svelte-kit/**',
		'**/storybook-static/**',
		'**/.storybook/**',
		'**/cypress/videos/**',
		'**/cypress/screenshots/**',
	], }, //<

	{   name: 'focused-ux/JS-TS', //>
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: null,
				ecmaVersion: 'latest',
				sourceType: 'module'
			}
			// 	],
			// 	tsconfigRootDir: process.cwd(),
			// },
		},
		plugins: {
			style: stylisticPlugin,
			ts: tsPlugin,
			import: importPlugin,
			unicorn: unicornPlugin,
			// antfu: antfuPlugin,
			'unused-imports': unusedImportsPlugin,
			'@seahax/wrap': seahaxWrapPlugin,
			'@nx': nxPlugin,
			eslintComments,
			node: nPlugin,
			// jsdoc: jsdocPlugin,
			'fux-format': fuxFormat,
		},
		rules: {
			// ...focusTornBaseRules,
			'license-header/header': 'off',
			'license/unknown': 'off',
			'no-console': 'off',
			'no-unused-vars': 'off',
			'antfu/curly': 'off',
			'space-in-parens': ['warn', 'never'],

			'unicorn/prefer-module': 'off',
			'unicorn/prefer-node-protocol': 'off',
			'node/prefer-global/process': 'off',
            
			// 'antfu/consistent-list-newline': 'off',
            
			// Array formatting
			'style/array-bracket-newline': ['warn', 'consistent'],
			'style/array-element-newline': ['warn', 'consistent'],
  
			// Object formatting  
			'style/object-curly-newline': 'off',
			'style/object-property-newline': ['warn', 'consistent'],
  
			// Function formatting
			'style/function-call-argument-newline': ['warn', 'consistent'],
			'style/function-paren-newline': ['warn', 'consistent'],
            
			'comma-spacing': ['warn', { before: false, after: true }],
			'no-extra-semi': 'warn',
			'operator-linebreak': ['warn', 'before'],
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
    
			'ts/no-explicit-any': 'warn',
    
			'style/implicit-arrow-linebreak': ['warn', 'beside'],
			'style/max-statements-per-line': 'off',
			'style/spaced-comment': 'off',
			
			// 'style/no-tabs': 'warn',
            'style/indent': ['warn', 4],
            
			'style/no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
			'style/no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 0 }],
			'style/no-trailing-spaces': ['warn', { skipBlankLines: true, ignoreComments: true }],
			'style/semi': ['warn', 'never'],
			'style/padded-blocks': [
				'warn',
				{ blocks: 'never', classes: 'always' },
				{ allowSingleLineBlocks: true },
			],
			'style/padding-line-between-statements': [
				'warn',
				{ blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
				{ blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
				{ blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
			],
        
			'style/brace-style': 'off',
			'style/function-call-argument-newline': 'off',
			'style/function-paren-newline': 'off',
			'style/array-element-newline': 'off',
			'style/object-property-newline': 'off',
        
			'import/no-unresolved': 'off',
			'import/no-cycle': 'off',
			'import/extensions': 'off',
			'import/no-duplicates': 'warn',
			'import/order': 'off',
        
			'ts/explicit-function-return-type': 'off',
			
			// Performance optimizations
			'import/no-cycle': 'off', // Expensive rule
			'import/no-unresolved': 'off', // Expensive rule
			'ts/no-unused-vars': 'warn', // Faster than 'error'
		},
	}, //<

	{   name: 'focused-ux/custom-formatting-tweaks', //>
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: { style: stylisticPlugin },
		rules: {
			'style/function-paren-newline': ['warn', 'multiline-arguments'],
			'style/function-call-argument-newline': ['warn', 'consistent'],
			'style/implicit-arrow-linebreak': ['warn', 'below'],
			'style/arrow-spacing': ['warn', { before: true, after: true }],
		},
	}, //<

	{   name: 'focused-ux/test-rules', //>
		files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts', '**/__tests__/**/*.ts'],
		plugins: { style: stylisticPlugin, ts: tsPlugin, import: importPlugin },
		rules: {
			'import/no-cycle': 'off',
			'import/extensions': 'off',
			'ts/no-explicit-any': 'off',
			'ts/explicit-function-return-type': 'off',
			'ts/no-unused-vars': 'off',
			'ts/no-use-before-define': 'off',
			'no-console': 'off',
			'no-unused-expressions': 'off',
			'no-magic-numbers': 'off',
			'max-lines-per-function': 'off',
			'max-statements-per-line': 'off',
			'style/padding-line-between-statements': 'off',
			'style/no-multiple-empty-lines': 'off',
			'style/brace-style': 'off',
		},
		languageOptions: {
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
		},
	}, //<

	{   name: 'focused-ux/shared-library', //>
		files: ['libs/shared/**/*.ts', 'libs/shared/**/*.tsx'],
		plugins: { ts: tsPlugin },
		rules: { 'ts/no-use-before-define': 'off' },
	}, //<

	{   name: 'focused-ux/markdown', //>
		files: ['**/*.md', '**/*.markdown'],
		plugins: { markdown: markdownPlugin },
		rules: {
			'markdown/heading-style': ['warn', 'atx'],
			'markdown/no-inline-html': 'warn',
		},
	}, //<

	{   name: 'focused-ux/yaml', //>
		files: ['**/*.{yml,yaml}'],
		plugins: { yml: ymlPlugin },
		languageOptions: { parser: yamlParser },
		rules: {
            
		},
	}, //<

	{   name: 'focused-ux/toml-rules', //>
		files: ['**/*.toml'],
		plugins: { toml: tomlPlugin },
		languageOptions: { parser: tomlParser },
		rules: {
			'toml/indent': ['warn', 4]
		},
	}, //<
	
	{   name: 'focused-ux/json-rules', //>
		files: [
			'**/*.json',
			'**/*.jsonc',
			"c:/Users/slett/AppData/Roaming/Cursor/User/settings.json"
		],
		ignores: [],
		plugins: {jsonc: jsoncPlugin, style: stylisticPlugin, 'fux-format': fuxFormat },
		languageOptions: { parser: jsoncParser },
		rules: {
            
			// 'style/no-multiple-empty-lines': ['warn', { max: 2, maxBOF: 0, maxEOF: 0 }],
            
			// 'jsonc/quotes': ['warn', 'double'],
			// 'jsonc/no-dupe-keys': 'error',
			'jsonc/indent': ['warn', 4],
			// "jsonc/indent": "off",
			// "jsonc/object-curly-newline": "off",
			// "jsonc/object-property-newline": "off",
			// "jsonc/array-element-newline": "off",
			// "jsonc/array-bracket-newline": "off",
			// "jsonc/array-bracket-spacing": "off",
			// "jsonc/object-curly-spacing": "off",
			// "jsonc/key-spacing": "off",
			// "jsonc/comma-style": "off"
            
			'fux-format/folding-brackets': 'warn',
			'jsonc/comma-dangle': ['warn', 'never'],
            
		},
	}, //<

	{   name: 'focused-ux/config-files', //>
		files: [
			'**/*.config.{js,ts,cjs,mjs}',
			'**/*.rc.{js,ts,cjs,mjs}',
		],
		languageOptions: { parser: tsParser, parserOptions: { project: null } },
		plugins: { style: stylisticPlugin, ts: tsPlugin, import: importPlugin, node: nPlugin, 'fux-format': fuxFormat },
		rules: {
			// Relax rules for config files
			'ts/explicit-function-return-type': 'off',
			'ts/no-use-before-define': 'off',
			'import/no-unresolved': 'off',
			'style/padding-line-between-statements': 'off',
			'no-console': 'off',
			'fux-format/triple-space-after-opening-brace': 'warn',
		},
	}, //<
    
]
