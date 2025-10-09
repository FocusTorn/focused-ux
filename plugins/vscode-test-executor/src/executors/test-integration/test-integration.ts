import { execSync } from 'node:child_process'
import { ExecutorContext } from '@nx/devkit'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'

export interface VscodeTestExecutorOptions {
    /** Path to the TypeScript config for integration tests */
    tsConfig: string
	
    /** Path to the VS Code test config file */
    config: string
	
    /** Test timeout in milliseconds */
    timeout?: number
	
    /** Whether to filter noisy output */
    filterOutput?: boolean
	
    /** Patterns to filter out from output when filterOutput is true */
    filterPatterns?: string[]
	
    /** Additional arguments to pass to vscode-test */
    additionalArgs?: string[]
}

/**
 * Executor for running VS Code integration tests with automatic compilation.
 */
export default async function vscodeTestExecutor(
    options: VscodeTestExecutorOptions,
    context: ExecutorContext
): Promise<{ success: boolean }> {

    const {
        tsConfig,
        config,
        timeout = 20000,
        filterOutput = true,
        filterPatterns = [
            'extensionEnabledApiProposals',
            'ChatSessionStore',
            'update#setState disabled',
            'update#ctor',
            'Started local extension host',
            'Settings Sync'
        ],
        additionalArgs = []
    } = options

    const projectRoot = context.projectGraph?.nodes[context.projectName!]?.data?.root

    if (!projectRoot) {

        throw new Error(`Project root not found for ${context.projectName}`)
    
    }

    try {

        // Step 1: Compile integration tests
        console.log('🔨 Compiling integration tests...')

        // Convert absolute path to relative path if needed
        const relativeTsConfig = tsConfig.startsWith(projectRoot)
            ? tsConfig.substring(projectRoot.length + 1)
            : tsConfig
        
        const tscCommand = `npx tsc -p ${relativeTsConfig}`

        execSync(tscCommand, {
            stdio: 'inherit',
            cwd: projectRoot
        })

        // Step 2: Run VS Code tests
        console.log('🧪 Running VS Code integration tests...')

        // Convert absolute path to relative path if needed
        const relativeConfig = config.startsWith(projectRoot)
            ? config.substring(projectRoot.length + 1)
            : config

        const vscodeTestArgs = [
            '--config', relativeConfig,
            '--verbose',
            '--timeout', timeout.toString(),
            '--reporter', 'spec',
            ...additionalArgs
        ]

        if (filterOutput) {

            // Use PowerShell filtering for Windows
            const filterPattern = filterPatterns.join("', '")
            const command = `powershell -Command "& {npx vscode-test ${vscodeTestArgs.join(' ')} 2>&1 | Select-String -NotMatch '${filterPattern}'}"`

            execSync(command, {
                stdio: 'inherit',
                cwd: projectRoot
            })
        
        } else {

            // Run without filtering
            const command = `npx vscode-test ${vscodeTestArgs.join(' ')}`

            execSync(command, {
                stdio: 'inherit',
                cwd: projectRoot
            })
        
        }

        // Step 3: Clean up VSCode test artifacts to prevent file handle leaks
        console.log('🧹 Cleaning up VSCode test artifacts...')
        try {

            await cleanupVscodeTestArtifacts(projectRoot, context.projectName!)
            console.log('✅ VSCode test artifacts cleaned up successfully')
        
        } catch (cleanupError) {

            console.warn('⚠️ Warning: Failed to clean up VSCode test artifacts:', cleanupError)
            // Don't fail the test run due to cleanup issues
        
        }

        return { success: true }
    
    } catch (error) {

        console.error('❌ VS Code integration tests failed:', error)
        
        // Clean up artifacts even on failure
        console.log('🧹 Cleaning up VSCode test artifacts after failure...')
        try {

            await cleanupVscodeTestArtifacts(projectRoot, context.projectName!)
            console.log('✅ VSCode test artifacts cleaned up after failure')
        
        } catch (cleanupError) {

            console.warn('⚠️ Warning: Failed to clean up VSCode test artifacts after failure:', cleanupError)
        
        }
        
        return { success: false }
    
    }

}

/**
 * Cleans up VSCode test artifacts to prevent file handle leaks.
 * This should be called after test execution to clean up user data directories and log files.
 * 
 * @param projectRoot - The root directory of the project being tested
 * @param packageName - The name of the package being tested
 */
async function cleanupVscodeTestArtifacts(projectRoot: string, packageName: string): Promise<void> {

    try {

        // Resolve paths for monorepo root and test artifacts
        const monorepoRoot = path.resolve(projectRoot, '..', '..', '..')
        const sharedCachePath = path.resolve(monorepoRoot, './libs/vscode-test-cli-config/.vscode-test')
        const userDataDir = path.resolve(sharedCachePath, 'user-data', packageName)
        
        // Clean up user data directory if it exists
        if (await pathExists(userDataDir)) {

            console.log(`🧹 Cleaning up VSCode test artifacts for ${packageName}...`)
            await fs.rm(userDataDir, { recursive: true, force: true })
            console.log(`✅ Cleaned up user data directory: ${userDataDir}`)
        
        }
        
        // Also clean up any orphaned log directories
        const userDataParentDir = path.resolve(sharedCachePath, 'user-data')

        if (await pathExists(userDataParentDir)) {

            const entries = await fs.readdir(userDataParentDir, { withFileTypes: true })

            for (const entry of entries) {

                if (entry.isDirectory()) {

                    const entryPath = path.resolve(userDataParentDir, entry.name)
                    // Check if directory is empty or contains only old log files
                    const subEntries = await fs.readdir(entryPath, { withFileTypes: true })
                    const hasRecentFilesResult = await hasRecentFiles(entryPath, subEntries)
                    
                    if (!hasRecentFilesResult) {

                        console.log(`🧹 Cleaning up orphaned test directory: ${entryPath}`)
                        await fs.rm(entryPath, { recursive: true, force: true })
                    
                    }
                
                }
            
            }
        
        }
        
    } catch (error) {

        console.warn(`⚠️ Warning: Failed to clean up VSCode test artifacts for ${packageName}:`, error)
        // Don't throw - cleanup failures shouldn't break the build
    
    }

}

/**
 * Checks if a path exists
 */
async function pathExists(path: string): Promise<boolean> {

    try {

        await fs.access(path)
        return true
    
    } catch {

        return false
    
    }

}

/**
 * Checks if a directory contains recent files (within last hour)
 */
async function hasRecentFiles(dirPath: string, entries: Dirent[]): Promise<boolean> {

    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    
    for (const entry of entries) {

        const entryPath = path.resolve(dirPath, entry.name)

        try {

            const stats = await fs.stat(entryPath)

            if (stats.mtime.getTime() > oneHourAgo) {

                return true
            
            }
        
        } catch {
            // Ignore stat errors
        }
    
    }
    
    return false

}
