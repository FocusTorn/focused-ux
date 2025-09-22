import { ExecutorContext } from '@nx/devkit'
import { AuditStructureExecutorSchema } from './schema'
import { auditTestStructure } from './test-structure-checks'
import { auditCodeStructure } from './code-structure-checks'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createTempDir } from '@nx/devkit/testing'
import executor from './audit-structure'

// Mock the test-structure-checks module
jest.mock('./test-structure-checks', () => ({
    auditTestStructure: jest.fn()
}))

// Mock the code-structure-checks module
jest.mock('./code-structure-checks', () => ({
    auditCodeStructure: jest.fn()
}))

const mockAuditTestStructure = auditTestStructure as jest.MockedFunction<typeof auditTestStructure>
const mockAuditCodeStructure = auditCodeStructure as jest.MockedFunction<typeof auditCodeStructure>

describe('AuditStructure Executor', () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = createTempDir()
        jest.clearAllMocks()
        
        // Default mock implementations
        mockAuditTestStructure.mockReturnValue({
            violations: [],
            totalFiles: 0,
            filesWithViolations: 0
        })
        
        mockAuditCodeStructure.mockReturnValue({
            violations: [],
            totalFiles: 0,
            filesWithViolations: 0
        })
    })

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should run successfully with no violations', async () => {
        mockAuditTestStructure.mockReturnValue({
            violations: [],
            totalFiles: 5,
            filesWithViolations: 0
        })

        const options: AuditStructureExecutorSchema = { mode: 'test' }
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:test' },
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

        const result = await executor(options, context)
        expect(result.success).toBe(true)
        expect(mockAuditTestStructure).toHaveBeenCalledWith(
            path.join(tempDir, 'packages', 'test-project'),
            false
        )
    })

    it('should fail with violations when warnOnly is false', async () => {
        mockAuditTestStructure.mockReturnValue({
            violations: [
                {
                    category: 'Duplicate Mock Class Definitions',
                    severity: 'CRITICAL',
                    file: 'test.test.ts',
                    line: 5,
                    column: 1,
                    message: 'Duplicate mock class found'
                }
            ],
            totalFiles: 1,
            filesWithViolations: 1
        })

        const options: AuditStructureExecutorSchema = { mode: 'test', warnOnly: false }
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:test' },
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

        const result = await executor(options, context)
        expect(result.success).toBe(false)
    })

    it('should succeed with violations when warnOnly is true', async () => {
        mockAuditTestStructure.mockReturnValue({
            violations: [
                {
                    category: 'Duplicate Mock Class Definitions',
                    severity: 'CRITICAL',
                    file: 'test.test.ts',
                    line: 5,
                    column: 1,
                    message: 'Duplicate mock class found'
                }
            ],
            totalFiles: 1,
            filesWithViolations: 1
        })

        const options: AuditStructureExecutorSchema = { mode: 'test', warnOnly: true }
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:test' },
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

        const result = await executor(options, context)
        expect(result.success).toBe(true)
    })

    it('should determine mode from executor name', async () => {
        mockAuditTestStructure.mockReturnValue({
            violations: [],
            totalFiles: 0,
            filesWithViolations: 0
        })

        const options: AuditStructureExecutorSchema = {}
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:test' },
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

        await executor(options, context)
        expect(mockAuditTestStructure).toHaveBeenCalled()
    })

    it('should handle code mode', async () => {
        mockAuditCodeStructure.mockReturnValue({
            violations: [],
            totalFiles: 10,
            filesWithViolations: 0
        })

        const options: AuditStructureExecutorSchema = { mode: 'code' }
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:code' },
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

        const result = await executor(options, context)
        expect(result.success).toBe(true)
        expect(mockAuditCodeStructure).toHaveBeenCalledWith(
            path.join(tempDir, 'packages', 'test-project'),
            false
        )
        expect(mockAuditTestStructure).not.toHaveBeenCalled()
    })

    it('should fail with code violations when warnOnly is false', async () => {
        mockAuditCodeStructure.mockReturnValue({
            violations: [
                {
                    category: 'Forbidden Shared References',
                    severity: 'CRITICAL',
                    file: 'src/service.ts',
                    line: 5,
                    column: 1,
                    message: 'Package references @fux/shared'
                }
            ],
            totalFiles: 1,
            filesWithViolations: 1
        })

        const options: AuditStructureExecutorSchema = { mode: 'code', warnOnly: false }
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:code' },
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

        const result = await executor(options, context)
        expect(result.success).toBe(false)
    })

    it('should succeed with code violations when warnOnly is true', async () => {
        mockAuditCodeStructure.mockReturnValue({
            violations: [
                {
                    category: 'Forbidden Shared References',
                    severity: 'CRITICAL',
                    file: 'src/service.ts',
                    line: 5,
                    column: 1,
                    message: 'Package references @fux/shared'
                }
            ],
            totalFiles: 1,
            filesWithViolations: 1
        })

        const options: AuditStructureExecutorSchema = { mode: 'code', warnOnly: true }
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:code' },
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

        const result = await executor(options, context)
        expect(result.success).toBe(true)
    })

    it('should handle all mode', async () => {
        mockAuditTestStructure.mockReturnValue({
            violations: [],
            totalFiles: 0,
            filesWithViolations: 0
        })

        const options: AuditStructureExecutorSchema = { mode: 'all' }
        const context: ExecutorContext = {
            root: tempDir,
            cwd: process.cwd(),
            isVerbose: false,
            projectName: 'test-project',
            target: { executor: 'audit-structure:all' },
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

        const result = await executor(options, context)
        expect(result.success).toBe(true)
        expect(mockAuditTestStructure).toHaveBeenCalled()
    })
})
