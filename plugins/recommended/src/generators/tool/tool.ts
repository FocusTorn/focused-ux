import { Tree, addProjectConfiguration, formatFiles, generateFiles, installPackagesTask } from '@nx/devkit'
import * as path from 'node:path'
import type { ToolGeneratorSchema } from './schema'

export async function toolGenerator(tree: Tree, options: ToolGeneratorSchema) {
	const projectRoot = `libs/tools/${options.name}`
    
	addProjectConfiguration(tree, options.name, {
		root: projectRoot,
		projectType: 'library',
		sourceRoot: `${projectRoot}/src`,
		targets: {},
	})
    
	generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options)
	
    await formatFiles(tree)
	
    return () => {
		installPackagesTask(tree)
	}
}

export default toolGenerator
