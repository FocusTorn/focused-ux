import { join, isAbsolute } from 'node:path'
import { workspaceRoot } from '@nx/devkit'
import type { ExecutorContext } from '@nx/devkit'
import type { PackExecutorSchema } from '../executors/pack/schema.js'
import * as temp from 'temp'

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
    tempDir: string
    finalOutputDir: string
    tarballFilename: string
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
   * Generate unique ID for temporary directories
   */
    generateUniqueId(): string {

        const baseHash = process.env.NX_TASK_HASH ? process.env.NX_TASK_HASH.slice(0, 9) : 'local'

        return `${baseHash}-${process.pid}-${Math.floor(Math.random() * 1_000_000)}`
    
    }

    /**
     * Resolve complete configuration from options and context
     */
    resolveConfiguration(options: PackExecutorSchema, context: ExecutorContext): ResolvedConfiguration {

        const packageDir = this.resolvePackageDir(options, context)
        const uniqueId = this.generateUniqueId()
    
        // Configuration
        const tempBase = options.tempPath || join(packageDir, '.npack')
        const overwrite = options.freshTemp ?? true
        const keepTemp = options.keepTemp ?? false
        const finalOutputDir = options.outputPath ? join(workspaceRoot, options.outputPath) : packageDir
        const debug = options.debug ?? false
        const dev = options.dev ?? false
        const install = options.install !== false // defaults to true

        // Use temp package to create temporary directory
        const tarballBaseName = 'temp' // Will be updated with actual package name
        const tempDirName = overwrite ? `${tarballBaseName}-local` : `${tarballBaseName}-${uniqueId}`
        
        // Create temp directory using temp package - no fallbacks
        const tempDir = temp.mkdirSync({
            dir: tempBase,
            prefix: tempDirName,
            suffix: ''
        })

        // Generate tarball filename
        const tarballFilename = dev ? 'temp-dev.tgz' : 'temp.tgz' // Will be updated with actual package name

        return {
            packageDir,
            tempBase,
            tempDir,
            finalOutputDir,
            tarballFilename,
            dev,
            freshTemp: overwrite,
            keepTemp,
            install,
            debug
        }
    
    }

    /**
     * Update configuration with package metadata
     */
    updateConfigurationWithMetadata(config: ResolvedConfiguration, metadata: PackageMetadata): ResolvedConfiguration {

        const { tarballBaseName, version } = metadata
    
        // Update temp directory name with actual package name
        const tempDirName = config.freshTemp ? `${tarballBaseName}-local` : `${tarballBaseName}-${config.tempDir.split('-').pop()}`
        
        // Create new temp directory using temp package with updated name - no fallbacks
        const tempDir = temp.mkdirSync({
            dir: config.tempBase,
            prefix: tempDirName,
            suffix: ''
        })

        // Update tarball filename with actual package name and version
        let tarballFilename = `${tarballBaseName}-${version}.tgz`

        if (config.dev) {

            const taskHash = process.env.NX_TASK_HASH

            if (!taskHash) {

                throw new Error('NX_TASK_HASH environment variable not found for dev build.')
            
            }

            // const shortHash = taskHash.slice(0, 9)

            tarballFilename = `${tarballBaseName}-dev.tgz`
        
        }

        return {
            ...config,
            tempDir,
            tarballFilename
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
