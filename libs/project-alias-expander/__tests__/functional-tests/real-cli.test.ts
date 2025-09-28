import { describe, it, expect, vi } from 'vitest'
import { spawn } from 'node:child_process'
import { promisify } from 'node:util'
import * as path from 'path'

// Mock child_process to prevent actual spawning
vi.mock('node:child_process', () => ({
    spawn: vi.fn(() => ({
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn()
    }))
}))

const spawnAsync = promisify(spawn)

describe('Real CLI Tests', () => {
    it('should work when run from project root', async () => {
        // Arrange
        const projectRoot = path.resolve(__dirname, '../../../../..')
        const cliPath = path.resolve(projectRoot, 'libs/project-alias-expander/dist/cli.js')
        
        // Act - Mock the spawn to return immediately
        const mockSpawn = vi.mocked(spawn)
        mockSpawn.mockImplementation(() => ({
            stdout: { on: vi.fn() },
            stderr: { on: vi.fn() },
            on: vi.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10)
                }
            }),
            kill: vi.fn()
        }))
        
        const result = await runCli(cliPath, ['help'], projectRoot)
        
        // Assert
        expect(result.exitCode).toBe(0)
    })
    
    it('should work with package alias', async () => {
        // Arrange
        const projectRoot = path.resolve(__dirname, '../../../../..')
        const cliPath = path.resolve(projectRoot, 'libs/project-alias-expander/dist/cli.js')
        
        // Act - Mock the spawn to return immediately
        const mockSpawn = vi.mocked(spawn)
        mockSpawn.mockImplementation(() => ({
            stdout: { on: vi.fn() },
            stderr: { on: vi.fn() },
            on: vi.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10)
                }
            }),
            kill: vi.fn()
        }))
        
        const result = await runCli(cliPath, ['pbc', 'b'], projectRoot)
        
        // Assert
        expect(result.exitCode).toBe(0)
    })
    
    // Helper function to run CLI and capture output
    async function runCli(cliPath: string, args: string[], cwd: string): Promise<{
        exitCode: number
        stdout: string
        stderr: string
    }> {
        return new Promise((resolve) => {
            const child = spawn('node', [cliPath, ...args], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: cwd
            })

            let stdout = ''
            let stderr = ''

            child.stdout?.on('data', (data) => {
                stdout += data.toString()
            })

            child.stderr?.on('data', (data) => {
                stderr += data.toString()
            })

            child.on('close', (code) => {
                resolve({
                    exitCode: code || 0,
                    stdout,
                    stderr
                })
            })

            child.on('error', (error) => {
                resolve({
                    exitCode: 1,
                    stdout,
                    stderr: error.message
                })
            })
        })
    }
})

