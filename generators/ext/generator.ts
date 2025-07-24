import type { Tree } from '@nx/devkit'
import { formatFiles, generateFiles, joinPathFragments, names } from '@nx/devkit'
import type { ExtensionPackageGeneratorSchema } from './schema.d.ts'

export default async function (tree: Tree, schema: ExtensionPackageGeneratorSchema) {
	const options = normalizeOptions(schema)

	// Create the package directory structure
	const packageRoot = joinPathFragments(options.directory ?? 'packages', options.name ?? 'ext')

	// Generate package files from templates
	generateFiles(tree, joinPathFragments(__dirname, './files'), packageRoot, {
		...options,
		...names(options.name),
		packageRoot,
		commandPrefix: names(options.name).fileName,
		configKey: names(options.name).fileName,
		tmpl: '',
	})

	await formatFiles(tree)
}

interface NormalizedSchema extends ExtensionPackageGeneratorSchema {
	projectName: string
	packageName: string
}

function normalizeOptions(schema: ExtensionPackageGeneratorSchema): NormalizedSchema {
	const name = names(schema.name)

	return {
		...schema,
		directory: schema.directory || 'packages',
		projectName: `@fux/${name.fileName}`,
		packageName: `@fux/${name.fileName}`,
	}
}
