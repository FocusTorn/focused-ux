import { execSync } from 'node:child_process'
import { ExecutorContext } from '@nx/devkit'

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
        
        const tscCommand = `tsc -p ${relativeTsConfig}`

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

        return { success: true }
    } catch (error) {
        console.error('❌ VS Code integration tests failed:', error)
        return { success: false }
    }
}
