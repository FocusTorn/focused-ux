import type { Tree } from '@nx/devkit'
import { formatFiles, generateFiles, joinPathFragments, names, updateJson } from '@nx/devkit'
import type { ToolGeneratorSchema } from './schema.d.ts'

export default async function (tree: Tree, schema: ToolGeneratorSchema) {
	const options = normalizeOptions(schema)

	// Create the package directory structure
	const packageRoot = joinPathFragments('libs/tools', options.name)

	// Generate package files from templates
	generateFiles(tree, joinPathFragments(__dirname, './files'), packageRoot, {
		...options,
		...names(options.name),
		packageRoot,
		tmpl: '',
	})

	// Update nx.json to include the new project
	updateJson(tree, 'nx.json', (json) => {
		// Add to release.projects if it doesn't exist
		if (json.release?.projects && !json.release.projects.includes(options.projectName)) {
			json.release.projects.push(options.projectName)
		}

		return json
	})

	await formatFiles(tree)
}

interface NormalizedSchema extends ToolGeneratorSchema {
	projectName: string
	packageName: string
}

function normalizeOptions(schema: ToolGeneratorSchema): NormalizedSchema {
	const name = names(schema.name)

	return {
		...schema,
		projectName: `@fux/${name.fileName}`,
		packageName: `@fux/${name.fileName}`,
	}
}
