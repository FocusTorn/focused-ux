import { ExecutorContext } from '@nx/devkit'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { TypecheckExecutorSchema } from './schema'
import executor from './typecheck'

const options: TypecheckExecutorSchema = {
    files: ['test/**/*.ts'],
    strict: true,
    target: 'es2022',
    moduleResolution: 'node',
    skipLibCheck: true,
    noImplicitAny: true,
    noImplicitReturns: true,
    noImplicitThis: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    exactOptionalPropertyTypes: true,
}

const context: ExecutorContext = {
    root: process.cwd(),
    cwd: process.cwd(),
    isVerbose: false,
    projectName: 'test-project',
    projectGraph: {
        nodes: {},
        dependencies: {},
    },
    projectsConfigurations: {
        projects: {
            'test-project': {
                root: 'test',
                sourceRoot: 'test/src',
                projectType: 'library',
                targets: {}
            }
        },
        version: 2,
    },
    nxJsonConfiguration: {},
}

describe('Typecheck Executor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should build correct TypeScript command with options', async () => {
        // Mock execSync to avoid actually running tsc
        const mockExecSync = vi.fn().mockImplementation(() => {
            // Simulate successful execution
        })
        
        vi.doMock('child_process', () => ({
            execSync: mockExecSync
        }))

        const output = await executor(options, context)
        
        expect(output.success).toBe(true)
        expect(mockExecSync).toHaveBeenCalledWith(
            expect.stringContaining('tsc --noEmit --strict --target es2022'),
            expect.objectContaining({
                stdio: 'inherit',
                cwd: process.cwd(),
                encoding: 'utf8'
            })
        )
    })

    it('should handle errors gracefully', async () => {
        // Mock execSync to throw an error
        const mockExecSync = vi.fn().mockImplementation(() => {
            throw new Error('TypeScript compilation failed')
        })
        
        vi.doMock('child_process', () => ({
            execSync: mockExecSync
        }))

        const output = await executor(options, context)
        
        expect(output.success).toBe(false)
    })
})
