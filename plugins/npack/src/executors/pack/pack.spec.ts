import { ExecutorContext } from '@nx/devkit'

import { PackExecutorSchema } from './schema.js'
import executor from './pack.js'

const options: PackExecutorSchema = {}
const context: ExecutorContext = {
    root: '',
    cwd: process.cwd(),
    isVerbose: false,
    projectGraph: {
        nodes: {},
        dependencies: {},
    },
    projectsConfigurations: {
        projects: {},
        version: 2,
    },
    nxJsonConfiguration: {},
}

describe('Pack Executor', () => {

    it('can run', async () => {

        const output = await executor(options, context)
        expect(output.success).toBe(true)
    
    })

})
