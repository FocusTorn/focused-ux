import { addProjectConfiguration, formatFiles, generateFiles, Tree } from '@nx/devkit'
import * as path from 'path'
import { TestsGeneratorSchema } from './schema'

export async function testsGenerator(tree: Tree, options: TestsGeneratorSchema) {
    const projectRoot = `${options.name}`

    // addProjectConfiguration(tree, options.name, {
    //     root: projectRoot,
    //     projectType: 'library',
    //     sourceRoot: `${projectRoot}/src`,
    //     targets: {},
    // })
    
    // Calculate relative paths from the generated location to the workspace root (POSIX)
    const baseConfigPath = path.posix.relative(projectRoot, 'vitest.functional.base')
    const baseCoveragePath = path.posix.relative(projectRoot, 'vitest.coverage.base')
    
    const templateOptions = {
        ...options,
        tmpl: '', // Remove __tmpl__ suffix from filenames
        baseConfigPath,
        baseCoveragePath
    }
    
    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, templateOptions)
    
    // Copy the Enhanced Mock Strategy documentation
    const mockStrategyPath = path.join(projectRoot, '__tests__/__mocks__/Mock-Strategy-Core.md')
    const sourceMockStrategyPath = path.posix.join('docs/testing/Mock-Strategy-Core.md')
    
    if (tree.exists(sourceMockStrategyPath)) {
        const mockStrategyContent = tree.read(sourceMockStrategyPath, 'utf8')

        tree.write(mockStrategyPath, mockStrategyContent!)
    }
    
    await formatFiles(tree)
}

export default testsGenerator
