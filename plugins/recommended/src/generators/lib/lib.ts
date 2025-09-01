import type { Tree } from '@nx/devkit'
import { addProjectConfiguration, formatFiles, generateFiles } from '@nx/devkit'
import * as path from 'node:path'
import type { LibGeneratorSchema } from './schema'

export async function libGenerator(tree: Tree, options: LibGeneratorSchema) {
	const projectRoot = `libs/${options.name}`
	const projectName = options.name
    
	// Parse tags if provided
	const tags = options.tags ? options.tags.split(',').map(tag => tag.trim()) : []
    
	addProjectConfiguration(tree, projectName, {
		root: projectRoot,
		projectType: 'library',
		sourceRoot: `${projectRoot}/src`,
		targets: {
			'build': {
				executor: '@nx/esbuild:esbuild',
				outputs: ['{options.outputPath}'],
				options: {
					main: `${projectRoot}/src/index.ts`,
					outputPath: `${projectRoot}/dist`,
					tsConfig: `${projectRoot}/tsconfig.lib.json`,
					platform: 'node',
					format: ['esm'],
					bundle: false,
					sourcemap: true,
					target: 'es2022',
					keepNames: true,
					declarationRootDir: `${projectRoot}/src`,
					thirdParty: false,
					deleteOutputPath: true,
					external: [],
				},
			},
			'lint': {
				executor: '@nx/eslint:lint',
				dependsOn: ['build', '^build'],
				options: {
					lintFilePatterns: [
						'{projectRoot}/**/*.ts',
						'{projectRoot}/**/*.tsx',
						'{projectRoot}/**/*.js',
						'{projectRoot}/**/*.jsx',
						'{projectRoot}/**/*.json',
						'{projectRoot}/**/*.jsonc',
					],
					eslintConfig: 'eslint.config.js',
					format: 'stylish',
					quiet: false,
				},
			},
			'lint:full': {
				executor: '@nx/eslint:lint',
				dependsOn: [
					{
						dependencies: true,
						target: 'lint',
						params: 'forward',
					},
				],
			},
			'validate': {
				executor: 'nx:run-commands',
				dependsOn: [],
				inputs: ['default', '^default'],
				outputs: [],
				cache: true,
				options: {
					commands: ['nx run {projectName}:lint --fix', 'nx run {projectName}:audit'],
					parallel: false,
				},
			},
			'validate:full': {
				executor: 'nx:run-commands',
				dependsOn: [
					{
						dependencies: true,
						target: 'validate',
						params: 'forward',
					},
				],
				inputs: ['default', '^default'],
				outputs: [],
				cache: true,
				options: {
					commands: ['nx run {projectName}:validate'],
					parallel: false,
				},
			},
			'audit': {
				executor: 'nx:run-commands',
				dependsOn: ['build', '^build'],
				inputs: ['default', '^default'],
				outputs: [],
				cache: true,
				options: {
					command: 'tsx libs/tools/structure-auditor/src/main.ts {projectName}',
					cwd: '{workspaceRoot}',
				},
			},
			'audit:full': {
				executor: 'nx:run-commands',
				dependsOn: [
					{
						dependencies: true,
						target: 'audit',
						params: 'forward',
					},
				],
				inputs: ['default', '^default'],
				outputs: [],
				cache: true,
				options: {
					commands: ['nx run {projectName}:audit'],
				},
			},
			'clean': {
				executor: 'nx:run-commands',
				options: {
					command: 'rimraf {projectRoot}/dist {projectRoot}/coverage {projectRoot}/.nx',
					cwd: '{workspaceRoot}',
				},
			},
			'clean:dist': {
				executor: 'nx:run-commands',
				options: {
					command: 'rimraf {projectRoot}/dist',
					cwd: '{workspaceRoot}',
				},
			},
			'clean:cache': {
				executor: 'nx:run-commands',
				options: {
					command: 'rimraf {projectRoot}/.nx',
					cwd: '{workspaceRoot}',
				},
			},
			'test': {
				executor: '@nx/vite:test',
				outputs: ['{options.reportsDirectory}'],
				dependsOn: ['^build'],
			},
			'test:full': {
				executor: '@nx/vite:test',
				outputs: ['{options.reportsDirectory}'],
				dependsOn: [
					{
						dependencies: true,
						target: 'test',
						params: 'forward',
					},
				],
				options: {
					passWithNoTests: true,
				},
			},
		},
		tags,
	})
    
	generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
		...options,
		tmpl: '',
	})
	await formatFiles(tree)
}

export default libGenerator
