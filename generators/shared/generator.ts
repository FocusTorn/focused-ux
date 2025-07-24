import type {
	Tree,
} from '@nx/devkit'
import {
	formatFiles,
	generateFiles,
	joinPathFragments,
	names,
} from '@nx/devkit'
import type { SharedPackageGeneratorSchema } from './schema.d.ts'

export default async function (tree: Tree, schema: SharedPackageGeneratorSchema) {
	const options = normalizeOptions(schema)

	// Create the package directory structure
	const packageRoot = joinPathFragments(options.directory ?? 'packages', options.name ?? 'shared')

	// Generate package files from templates
	generateFiles(tree, joinPathFragments(__dirname, './files'), packageRoot, {
		...options,
		...names(options.name),
		tmpl: '',
	})

	await formatFiles(tree)
}

interface NormalizedSchema extends SharedPackageGeneratorSchema {
	projectName: string
	packageName: string
}

function normalizeOptions(schema: SharedPackageGeneratorSchema): NormalizedSchema {
	const name = names(schema.name)

	return {
		...schema,
		directory: schema.directory || 'packages',
		projectName: `@fux/${name.fileName}`,
		packageName: `@fux/${name.fileName}`,
	}
}
