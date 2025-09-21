import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration } from '@nx/devkit'

import { testsGenerator } from './tests'
import { TestsGeneratorSchema } from './schema'

describe('tests generator', () => {
    let tree: Tree
    const options: TestsGeneratorSchema = { name: 'test' }

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace()
    })

    it('should run successfully', async () => {
        await testsGenerator(tree, options)
        const config = readProjectConfiguration(tree, 'test')
        expect(config).toBeDefined()
    })
})
