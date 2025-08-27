import type { Tree } from '@nx/devkit'
import { formatFiles, generateFiles, joinPathFragments, names, updateJson } from '@nx/devkit'
import type { LibPackageGeneratorSchema } from './schema.d.ts'

export default async function (tree: Tree, schema: LibPackageGeneratorSchema) {
	const options = normalizeOptions(schema)

	// Create the library directory structure
	const libRoot = joinPathFragments(options.directory ?? 'libs', options.name ?? 'lib')

	// Generate library files from templates
	generateFiles(tree, joinPathFragments(__dirname, './files'), libRoot, {
		...options,
		...names(options.name),
		libRoot,
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
			const includePath = `${libRoot}/**/*`
			if (!json.plugins[0].include.includes(includePath)) {
				json.plugins[0].include.push(includePath)
			}
		}

		return json
	})

	await formatFiles(tree)
}

interface NormalizedSchema extends LibPackageGeneratorSchema {
	projectName: string
	packageName: string
}

function normalizeOptions(schema: LibPackageGeneratorSchema): NormalizedSchema {
	const name = names(schema.name)

	return {
		...schema,
		directory: schema.directory || 'libs',
		projectName: `@fux/${name.fileName}`,
		packageName: `@fux/${name.fileName}`,
	}
} 