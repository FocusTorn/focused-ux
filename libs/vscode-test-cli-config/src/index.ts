import { defineConfig } from '@vscode/test-cli'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'

/**
 * Defines the package-specific options required by the configuration factory.
 */
export interface FuxVSCodeTestConfigOptions {
    /** A unique name for the package being tested, used for the user data directory. */
    packageName: string

    /** The absolute path to the extension's development directory (usually `__dirname`). */
    extensionDevelopmentPath: string

    /** The relative path to the test workspace directory. */
    workspaceFolder: string

    /** A glob pattern for test files. Defaults to `./out-tsc/suite/**\/*.test.js`. */
    files?: string | string[]

    /** A path to a test setup file. Defaults to `./out-tsc/suite/index.js`. */
    setupFiles?: string | string[]

    /** Any other options to pass through to the underlying `defineConfig`. */
    [key: string]: any
}

/**
 * Creates a standardized VS Code integration test configuration.
 * @param options - Package-specific options.
 * @returns The complete test configuration object.
 */
export function createVscodeTestConfig(options: FuxVSCodeTestConfigOptions) {
    const {
        packageName,
        extensionDevelopmentPath,
        workspaceFolder,
        files = './out-tsc/**/*.test.js',
        setupFiles = './out-tsc/index.js',
        ...restOptions
    } = options

    // Resolve paths for monorepo root and package-local test data
    const monorepoRoot = path.resolve(extensionDevelopmentPath, '..', '..', '..')
    const sharedCachePath = path.resolve(monorepoRoot, './libs/vscode-test-cli-config/.vscode-test')
    const packageUserDataDir = path.resolve(sharedCachePath, 'user-data', packageName)
    const sharedExtensionsPath = path.resolve(sharedCachePath, 'extensions')

    const defaultConfig = {
        // Centralize the VS Code download location at the monorepo root
        cachePath: sharedCachePath,
        version: 'insiders',
        files,
        workspaceFolder,
        setupFiles,
        extensionDevelopmentPath,
        env: {
            VSCODE_TEST: '1',
        },
        launchArgs: [
            // Use a dedicated, package-specific user data directory in the root for an isolated run
            '--user-data-dir',
            packageUserDataDir,

            // Centralize the extensions directory to prevent local .vscode-test folders
            '--extensions-dir',
            sharedExtensionsPath,

            // Disable all extensions except for the one being tested for a clean environment.
            '--disable-extensions',

            // Disable the workspace trust feature to prevent popups that can block tests.
            '--disable-workspace-trust',

            // Disable Settings Sync to prevent authentication provider timeouts.
            '--sync',
            'off',

            // Explicitly disable noisy or conflicting built-in and common extensions.
            '--disable-extension',
            'ms-vsliveshare.vsliveshare',
            '--disable-extension',
            'ms-python.python',
            '--disable-extension',
            'ms-python.gather',
            '--disable-extension',
            'vscode.git',
            // '--disable-extension',
            // 'vscode.github-authentication',
            // '--disable-extension',
            // 'GitHub.copilot',
            // '--disable-extension',
            // 'GitHub.copilot-chat',
            // '--disable-extension',
            // 'github.vscode-pull-request-github',
            // '--disable-extension',
            // 'github.codespaces',
            // '--disable-extension',
            // 'github.copilot-labs',

            // Load our extension for testing.
            '--extensionDevelopmentPath',
            extensionDevelopmentPath,
        ],
    }

    // Merge the default config with any passthrough options
    return defineConfig({ ...defaultConfig, ...restOptions })
}

/**
 * Cleans up VSCode test artifacts to prevent file handle leaks.
 * This should be called after test execution to clean up user data directories and log files.
 * 
 * @param projectRoot - The root directory of the project being tested
 * @param packageName - The name of the package being tested
 */
export async function cleanupVscodeTestArtifacts(projectRoot: string, packageName: string): Promise<void> {
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

/**
 * Cleans up all VSCode test artifacts across the entire workspace.
 * This is useful for a global cleanup operation.
 */
export async function cleanupAllVscodeTestArtifacts(workspaceRoot: string): Promise<void> {
    try {
        const sharedCachePath = path.resolve(workspaceRoot, './libs/vscode-test-cli-config/.vscode-test')
        const userDataDir = path.resolve(sharedCachePath, 'user-data')
        
        if (await pathExists(userDataDir)) {
            console.log('🧹 Cleaning up all VSCode test artifacts...')
            await fs.rm(userDataDir, { recursive: true, force: true })
            console.log(`✅ Cleaned up all user data directories: ${userDataDir}`)
        }
        
    } catch (error) {
        console.warn('⚠️ Warning: Failed to clean up all VSCode test artifacts:', error)
    }
}
