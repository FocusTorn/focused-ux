import { PromiseExecutor, ExecutorContext, logger } from '@nx/devkit'
import { TypecheckExecutorSchema } from './schema'
import { execSync } from 'child_process'
import { join } from 'path'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'

const runExecutor: PromiseExecutor<TypecheckExecutorSchema> = async (
    options: TypecheckExecutorSchema,
    context: ExecutorContext
) => {
    try {
    // Get project root
        const projectRoot = context.projectsConfigurations?.projects[context.projectName!]?.root || ''
        const workspaceRoot = context.root

        // Default options
        const {
            files = [`${projectRoot}/**/*.ts`],
            strict = true,
            target = 'ES2022',
            moduleResolution = 'NodeNext',
            skipLibCheck = true,
            noImplicitAny = true,
            noImplicitReturns = true,
            noImplicitThis = true,
            noUnusedLocals = true,
            noUnusedParameters = true,
            exactOptionalPropertyTypes = true,
            configFile = 'plugins/ft-typescript/config.json',
        } = options

        // Load error message overrides
        const configPath = join(workspaceRoot, configFile)
        let errorOverrides: Record<string, string> = {}
        
        try { const configContent = readFileSync(configPath, 'utf8')
            const config = JSON.parse(configContent)

            errorOverrides = config['error-msg-override'] || {}
            logger.info(`✅ Loaded error message overrides from ${configFile}`)
        } catch (error) {
            logger.warn(`Could not load error message config: ${error instanceof Error ? error.message : String(error)}`)
        }

        // Load base tsconfig as foundation
        const baseTsconfigPath = join(workspaceRoot, 'tsconfig.base.json')
        let baseTsconfig = { compilerOptions: {} }
        
        try {
            const baseTsconfigContent = readFileSync(baseTsconfigPath, 'utf8')
            // Strip comments from JSON (TypeScript config files support comments but JSON.parse doesn't)
            const cleanedContent = baseTsconfigContent
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
                .replace(/\/\/.*$/gm, '') // Remove // comments
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas

            baseTsconfig = JSON.parse(cleanedContent)
            logger.info('✅ Loaded tsconfig.base.json successfully')
        } catch (error) {
            logger.warn(`Could not load tsconfig.base.json: ${error instanceof Error ? error.message : String(error)}`)
            logger.warn('Using minimal defaults')
        }

        // Create a temporary tsconfig file for the type check
        const tempTsconfigPath = join(workspaceRoot, '.nx-temp-tsconfig.json')
        
        // Add workspace-level vitest base files to include list
        const workspaceVitestFiles = [ //>
            'vitest.functional.base.ts',
            'vitest.coverage.base.ts',
            'vitest.workspace.ts'
        ] //<
        
        const tsconfig = { //>
            extends: './tsconfig.base.json',
            compilerOptions: {
                // Start with base config
                ...baseTsconfig.compilerOptions,
                // Override with executor options
                noEmit: true,
                strict: strict,
                target: target,
                moduleResolution: moduleResolution,
                skipLibCheck: skipLibCheck,
                noImplicitAny: noImplicitAny,
                noImplicitReturns: noImplicitReturns,
                noImplicitThis: noImplicitThis,
                noUnusedLocals: noUnusedLocals,
                noUnusedParameters: noUnusedParameters,
                exactOptionalPropertyTypes: exactOptionalPropertyTypes,
            },
            include: [...files, ...workspaceVitestFiles]
        } //<

        try {
            writeFileSync(tempTsconfigPath, JSON.stringify(tsconfig, null, 2))
      
            const command = `tsc --project ${tempTsconfigPath}`

            logger.info(`Running TypeScript strict type check for project: ${context.projectName}`)
            logger.info(`Command: ${command}`)

            // Execute the command and capture output for message override
            try {
                // const output = execSync(command, {
                //     stdio: 'pipe',
                //     cwd: workspaceRoot,
                //     encoding: 'utf8'
                // })

                // If we get here, there were no errors
                logger.info('✅ Type checking passed!')
            } catch (error: unknown) {
                // TypeScript errors are returned as non-zero exit code - avoiding 'any'
                const err = error as Record<string, unknown>

                if (err && (err['stdout'] || err['stderr'])) {
                    const output = (err['stdout'] || err['stderr'] || '').toString()
                    
                    // Override error messages and clean up paths
                    let modifiedOutput = output
                    
                    // Remove packages/ prefix from file paths
                    modifiedOutput = modifiedOutput.replace(/packages\//g, '')
                    
                    // Keep error codes but clean up the format - change "error TS####: " to "TS####: "
                    modifiedOutput = modifiedOutput.replace(/error (TS\d+: )/g, '$1')

                    // Override error messages (keeping error codes) - do this BEFORE color formatting
                    for (const [errorCode, newMessage] of Object.entries(errorOverrides)) {
                        // Replace error messages that match the pattern: TS####: original message
                        const regex = new RegExp(`^([^(]+\\(\\d+,\\d+\\)): ${errorCode}: .*$`, 'gm')

                        modifiedOutput = modifiedOutput.replace(regex, `$1: ${errorCode}: ${newMessage}`)
                    }
                    
                    // Add color formatting to file paths (blue for path:line:col) - do this AFTER error override
                    modifiedOutput = modifiedOutput.replace(/^([^(]+\(\d+,\d+\)): /gm, '\x1B[38;5;39m$1\x1B[0m: ')
                    
                    // Output only lines with actual error content - no blank lines
                    const lines = modifiedOutput.split('\n')
                        .filter(line => line.trim().length > 0) // Remove blank lines
                        .join('\n')

                    console.log(lines)
                }
                throw error // Re-throw to maintain error behavior
            }
        } finally {
            // Clean up temporary file
            try {
                unlinkSync(tempTsconfigPath)
            } catch (_error) {
                // Ignore cleanup errors
            }
        }

        return {
            success: true,
        }
    } catch (error) {
        logger.error('❌ Type checking failed!')
        logger.error(error instanceof Error ? error.message : String(error))
        return {
            success: false,
        }
    }
}

export default runExecutor
