import type { Tree } from '@nx/devkit'
import { formatFiles, generateFiles, joinPathFragments, names, updateJson } from '@nx/devkit'
import type { CorePackageGeneratorSchema } from './schema.d.ts'

export default async function (tree: Tree, schema: CorePackageGeneratorSchema) {
	const options = normalizeOptions(schema)

	// Create the package directory structure
	const packageRoot = joinPathFragments(options.directory ?? 'packages', options.name ?? 'core', 'core')

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

		// Add to plugins.include if it doesn't exist
		if (json.plugins?.[0]?.include) {
			const includePath = `${packageRoot}/**/*`
			if (!json.plugins[0].include.includes(includePath)) {
				json.plugins[0].include.push(includePath)
			}
		}

		return json
	})

	await formatFiles(tree)
}

interface NormalizedSchema extends CorePackageGeneratorSchema {
	projectName: string
	packageName: string
}

function normalizeOptions(schema: CorePackageGeneratorSchema): NormalizedSchema {
	const name = names(schema.name)

	return {
		...schema,
		directory: schema.directory || 'packages',
		projectName: `@fux/${name.fileName}`,
		packageName: `@fux/${name.fileName}`,
	}
}
