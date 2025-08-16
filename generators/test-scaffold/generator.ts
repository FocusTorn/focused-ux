import type { Tree } from '@nx/devkit'
import { formatFiles, generateFiles, joinPathFragments, names, readProjectConfiguration, updateJson } from '@nx/devkit'
import type { TestScaffoldGeneratorSchema } from './schema.d.ts'

export default async function (tree: Tree, schema: TestScaffoldGeneratorSchema) {
	const options = normalizeOptions(tree, schema)

	// Get the project configuration to determine the project root
	const projectConfig = readProjectConfiguration(tree, options.project)
	const projectRoot = projectConfig.root

	// Calculate relative paths for vitest configs
	const relativePaths = calculateRelativePaths(projectRoot)

	// Generate test files from templates
	generateFiles(tree, joinPathFragments(__dirname, './files'), projectRoot, {
		...options,
		...names(options.project),
		projectRoot,
		relativePaths,
		tmpl: '',
	})

	// Update project configuration to ensure proper test targets
	updateProjectConfiguration(tree, options, projectRoot)

	await formatFiles(tree)
}

interface NormalizedSchema extends TestScaffoldGeneratorSchema {
	projectName: string
	packageName: string
	hasTestTargets: boolean
	isCorePackage: boolean
	isExtPackage: boolean
	isSharedPackage: boolean
	isLibPackage: boolean
}

interface RelativePaths {
	vitestBase: string
	sharedSrc: string
	sharedVscodeAdapter: string
}

function calculateRelativePaths(projectRoot: string): RelativePaths {
	// Calculate relative path to workspace root (where vitest.base.ts is located)
	const projectDepth = projectRoot.split('/').length
	const vitestBase = `${'../'.repeat(projectDepth)}vitest.base`
	
	// Calculate relative path to shared library
	const sharedPath = projectRoot.startsWith('libs/')
		? '../shared/src/index.ts'
		: `${'../'.repeat(projectDepth)}libs/shared/src/index.ts`
	
	// Calculate relative path to vscode test adapter
	const vscodeAdapterPath = projectRoot.startsWith('libs/')
		? '../shared/vscode-test-adapter.ts'
		: `${'../'.repeat(projectDepth)}libs/shared/vscode-test-adapter.ts`

	return {
		vitestBase,
		sharedSrc: sharedPath,
		sharedVscodeAdapter: vscodeAdapterPath,
	}
}

function normalizeOptions(tree: Tree, schema: TestScaffoldGeneratorSchema): NormalizedSchema {
	const name = names(schema.project)
	const projectConfig = readProjectConfiguration(tree, schema.project)
	
	return {
		...schema,
		projectName: schema.project,
		packageName: `@fux/${name.fileName}`,
		hasTestTargets: projectConfig.targets?.test !== undefined,
		isCorePackage: schema.packageType === 'core',
		isExtPackage: schema.packageType === 'ext',
		isSharedPackage: schema.packageType === 'shared',
		isLibPackage: schema.packageType === 'lib',
	}
}

function updateProjectConfiguration(tree: Tree, options: NormalizedSchema, projectRoot: string) {
	// Ensure the project has proper test configuration
	updateJson(tree, `${projectRoot}/project.json`, (json) => {
		// Add test targets if they don't exist
		if (!json.targets) {
			json.targets = {}
		}

		// Add functional test target
		if (!json.targets.test) {
			json.targets.test = {
				executor: '@nx/vite:test',
				outputs: ['{options.reportsDirectory}'],
				options: {
					configFile: `${projectRoot}/vitest.functional.config.ts`,
					reporters: 'default',
				},
			}
		}

		// Add coverage test target
		if (!json.targets['test:full']) {
			json.targets['test:full'] = {
				executor: '@nx/vite:test',
				outputs: ['{options.reportsDirectory}'],
				options: {
					configFile: `${projectRoot}/vitest.coverage.config.ts`,
					reporters: 'default',
				},
			}
		}

		// Add test:full dependency on test if not already configured
		if (json.targets['test:full'] && !json.targets['test:full'].dependsOn) {
			json.targets['test:full'].dependsOn = ['^test']
		}

		// Add build dependency for test targets if this is a core package
		if (options.isCorePackage && json.targets.test && !json.targets.test.dependsOn) {
			json.targets.test.dependsOn = ['^build']
		}

		return json
	})
}
