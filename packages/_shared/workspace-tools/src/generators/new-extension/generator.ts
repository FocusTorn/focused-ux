import type {
	Tree,
} from '@nx/devkit'
import {
	formatFiles,
	generateFiles,
	updateJson,
} from '@nx/devkit'
import * as path from 'node:path'
import type { NewExtensionGeneratorSchema } from './schema'

function toPascalCase(str: string): string {
	return str.replace(/(^\w|-\w)/g, text => text.replace(/-/, '').toUpperCase())
}

function getAliases(name: string) {
	const parts = name.split('-')
	const alias = parts.map((p: string) => p[0]).join('')

	return { alias, aliasCore: `${alias}c` }
}

export async function newExtensionGenerator(
	tree: Tree,
	options: NewExtensionGeneratorSchema,
) {
	const { name } = options
	const pascalCaseName = toPascalCase(name)
	const { alias, aliasCore } = getAliases(name)

	const templateOptions = {
		name,
		pascalCaseName,
		alias,
		aliasCore,
		template: '',
	}

	// Generate core and ext files from templates
	generateFiles(
		tree,
		path.join(__dirname, 'files'),
		`packages/${name}`,
		templateOptions,
	)

	// Update root tsconfig.json
	updateJson(tree, 'tsconfig.json', (json) => {
		json.references.push(
			{ path: `packages/${name}/core` },
			{ path: `packages/${name}/ext` },
		)
		return json
	})

	// Update root nx.json
	updateJson(tree, 'nx.json', (json) => {
		const eslintPlugin = json.plugins.find((p: { plugin: string }) => p.plugin === '@nx/eslint/plugin')

		if (eslintPlugin) {
			eslintPlugin.include.push(
				`packages/${name}/core/**/*`,
				`packages/${name}/ext/**/*`,
			)
		}
		return json
	})

	// Update pnpm_aliases.json
	updateJson(tree, '_scripts/ps/pnpm_aliases.json', (json) => {
		json[aliasCore] = `@fux/${name}-core`
		json[alias] = `@fux/${name}-ext`
		return json
	})

	// Update VS Code launch.json
	updateJson(tree, '.vscode/launch.json', (json) => {
		json.configurations.push({
			name: pascalCaseName,
			type: 'extensionHost',
			request: 'launch',
			args: [
				'--profile=Clean',
				`--extensionDevelopmentPath=\${workspaceFolder}/packages/${name}/ext`,
				`\${workspaceFolder}`,
			],
			sourceMaps: true,
			preLaunchTask: `Build ${pascalCaseName}`,
		})
		return json
	})

	// Update VS Code tasks.json
	updateJson(tree, '.vscode/tasks.json', (json) => {
		json.tasks.push({
			label: `Build ${pascalCaseName}`,
			type: 'shell',
			command: `nx run @fux/${name}-ext:build:production`,
			problemMatcher: ['$tsc-watch', '$ts-esbuild-watch'],
			presentation: {
				panel: 'shared',
				group: 'satPrelaunch',
				clear: true,
				reveal: 'never',
			},
			group: 'build',
		})
		return json
	})

	// Update pnpm-workspace.yaml
	const workspaceYamlPath = 'pnpm-workspace.yaml'
	const workspaceYaml = tree.read(workspaceYamlPath, 'utf-8')

	if (workspaceYaml === null) {
		throw new Error(`${workspaceYamlPath} not found`)
	}

	const updatedYaml = workspaceYaml.replace(
		/^(packages:)/m,
		`$1\n  - packages/${name}/core\n  - packages/${name}/ext`,
	)

	tree.write(workspaceYamlPath, updatedYaml)

	await formatFiles(tree)
}

export default newExtensionGenerator
