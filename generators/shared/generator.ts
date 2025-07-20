import type {
	Tree,
} from '@nx/devkit'
import {
	formatFiles,
	generateFiles,
	joinPathFragments,
	names,
} from '@nx/devkit'
import type { SharedPackageGeneratorSchema } from './schema.d'

export default async function (tree: Tree, schema: SharedPackageGeneratorSchema) {
	const options = normalizeOptions(schema)
  
	// Create the package directory structure
	const packageRoot = joinPathFragments(options.directory, options.name)
  
	// Generate package files
	generateFiles(tree, joinPathFragments(__dirname, './files'), packageRoot, {
		...options,
		...names(options.name),
		tmpl: '',
	})

	// Update workspace configuration
	const workspacePath = 'nx.json'

	if (tree.exists(workspacePath)) {
		const workspaceContent = tree.read(workspacePath, 'utf-8')
		const workspace = JSON.parse(workspaceContent)
    
		workspace.projects = workspace.projects || {}
		workspace.projects[options.projectName] = {
			root: packageRoot,
			sourceRoot: joinPathFragments(packageRoot, 'src'),
			projectType: 'library',
			targets: {
				build: {
					extends: 'build:core',
				},
				lint: {},
			},
			tags: ['type:shared'],
		}
    
		tree.write(workspacePath, JSON.stringify(workspace, null, 2))
	}

	// Update pnpm workspace
	const pnpmWorkspacePath = 'pnpm-workspace.yaml'

	if (tree.exists(pnpmWorkspacePath)) {
		const workspaceContent = tree.read(pnpmWorkspacePath, 'utf-8')
		const updatedContent = workspaceContent.replace(
			/packages:/,
			`packages:
  - '${packageRoot}'`,
		)

		tree.write(pnpmWorkspacePath, updatedContent)
	}

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
