import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration } from '@nx/devkit'

import { toolGenerator } from './tool'
import { ToolGeneratorSchema } from './schema'

describe('tool generator', () => {
    let tree: Tree
    const options: ToolGeneratorSchema = { name: 'test' }

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace()
    })

    it('should run successfully', async () => {
        await toolGenerator(tree, options)
        const config = readProjectConfiguration(tree, 'test')
        expect(config).toBeDefined()
    })
})
