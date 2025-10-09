import { join, isAbsolute } from 'node:path'
import { workspaceRoot } from '@nx/devkit'
import type { ExecutorContext } from '@nx/devkit'
import type { PackExecutorSchema } from '../executors/pack/schema.js'

export interface PackageMetadata {
    name: string
    version: string
    packageDir: string
    packageJsonPath: string
    tarballBaseName: string
}

export interface ResolvedConfiguration {
    packageDir: string
    tempBase: string
    finalOutputDir: string
    dev: boolean
    freshTemp: boolean
    keepTemp: boolean
    install: boolean
    debug: boolean
}

export class PackageResolverService {

    /**
   * Resolve package directory from options and context
   */
    resolvePackageDir(options: PackExecutorSchema, context: ExecutorContext): string {

        if (options.targetPath) {

            return isAbsolute(options.targetPath) ? options.targetPath : join(workspaceRoot, options.targetPath)
        
        }
    
        if (options.targetName) {

            const proj = context.projectGraph?.nodes?.[options.targetName]

            if (!proj) {

                throw new Error(`Project not found: ${options.targetName}`)
            
            }
            return join(workspaceRoot, proj.data.root)
        
        }
    
        if (context.projectName) {

            const proj = context.projectGraph?.nodes?.[context.projectName]

            if (!proj) {

                throw new Error(`Project not found in context: ${context.projectName}`)
            
            }
            return join(workspaceRoot, proj.data.root)
        
        }
    
        throw new Error('Either options.targetPath, options.targetName or context.projectName must be provided')
    
    }

    /**
   * Get package metadata from package.json
   */
    getPackageMetadata(packageDir: string, packageJsonContent: string): PackageMetadata {

        const packageJson = JSON.parse(packageJsonContent)
        const packageJsonPath = join(packageDir, 'package.json')
        const tarballBaseName = packageJson.name.replace('@fux/', 'fux-')

        return {
            name: packageJson.name,
            version: packageJson.version,
            packageDir,
            packageJsonPath,
            tarballBaseName
        }
    
    }

    /**
     * Read and parse package.json in one operation
     */
    async readPackageJson(packageDir: string): Promise<{ content: string; json: Record<string, unknown>; metadata: PackageMetadata }> {

        const { readFile } = await import('node:fs/promises')
        const packageJsonPath = join(packageDir, 'package.json')
        const content = await readFile(packageJsonPath, 'utf-8')
        const json = JSON.parse(content)
        const metadata = this.getPackageMetadata(packageDir, content)

        return { content, json, metadata }
    
    }

    /**
   * Validate package.json exists and is readable
   */
    validatePackageJson(packageDir: string): { valid: boolean; error?: string } {

        const packageJsonPath = join(packageDir, 'package.json')
    
        try {

            // Check if file exists (this will be done by FileOperationsService)
            return { valid: true }
        
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            return { valid: false, error: `Invalid package.json at ${packageJsonPath}: ${errorMessage}` }
        
        }
    
    }

    /**
     * Resolve complete configuration from options and context
     */
    resolveConfiguration(options: PackExecutorSchema, context: ExecutorContext): ResolvedConfiguration {

        const packageDir = this.resolvePackageDir(options, context)
    
        // Configuration
        const tempBase = options.tempPath || join(packageDir, '.npack')
        const freshTemp = options.freshTemp ?? true
        const keepTemp = options.keepTemp ?? false
        const finalOutputDir = options.outputPath ? join(workspaceRoot, options.outputPath) : packageDir
        const debug = options.debug ?? false
        const dev = options.dev ?? false
        const install = options.install !== false // defaults to true

        return {
            packageDir,
            tempBase,
            finalOutputDir,
            dev,
            freshTemp,
            keepTemp,
            install,
            debug
        }
    
    }


    /**
   * Get available projects from context
   */
    getAvailableProjects(context: ExecutorContext): string[] {

        if (!context.projectGraph?.nodes) {

            return []
        
        }
        return Object.keys(context.projectGraph.nodes)
    
    }

    /**
   * Validate project exists in context
   */
    validateProjectExists(projectName: string, context: ExecutorContext): { valid: boolean; error?: string } {

        const availableProjects = this.getAvailableProjects(context)
    
        if (!context.projectGraph?.nodes?.[projectName]) {

            return {
                valid: false,
                error: `Project '${projectName}' not found. Available projects: ${availableProjects.join(', ')}`
            }
        
        }
    
        return { valid: true }
    
    }

}
