import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, statSync, readdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { logger } from '@nx/devkit'
import * as temp from 'temp'

export interface FileOperationsResult {
    success: boolean
    error?: string
}

export interface DirectoryInfo {
    path: string
    exists: boolean
    isDirectory: boolean
    files: string[]
}

export interface CopyOptions {
    recursive?: boolean
    force?: boolean
    errorOnExist?: boolean
}

export class FileOperationsService {

    /**
   * Check if a file or directory exists
   */
    exists(path: string): boolean {

        return existsSync(path)
    
    }

    /**
   * Get information about a directory
   */
    getDirectoryInfo(path: string): DirectoryInfo {

        const exists = this.exists(path)
        const isDirectory = exists ? statSync(path).isDirectory() : false
        const files = exists && isDirectory ? readdirSync(path) : []

        return {
            path,
            exists,
            isDirectory,
            files
        }
    
    }

    /**
     * Create directories recursively
     */
    createDirectories(paths: string[]): FileOperationsResult {

        try {

            for (const path of paths) {

                // Use temp package for temporary directories, regular mkdirSync for others
                if (path.includes('.npack') || path.includes('temp-')) {

                    // This is a temporary directory, use temp package - no fallbacks
                    temp.mkdirSync({ dir: path })

                } else {

                    mkdirSync(path, { recursive: true })

                }
            
            }
            return { success: true }
        
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Failed to create directories: ${errorMessage}`)
            return { success: false, error: errorMessage }
        
        }
    
    }

    /**
   * Read file content as string
   */
    readFile(filePath: string): string {

        return readFileSync(filePath, 'utf-8')
    
    }

    /**
   * Write content to file
   */
    writeFile(filePath: string, content: string): FileOperationsResult {

        try {

            writeFileSync(filePath, content, 'utf-8')
            return { success: true }
        
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Failed to write file ${filePath}: ${errorMessage}`)
            return { success: false, error: errorMessage }
        
        }
    
    }

    /**
   * Copy file or directory
   */
    copy(source: string, destination: string, options: CopyOptions = {}): FileOperationsResult {

        try {

            const { recursive = false, force = true, errorOnExist = false } = options

            if (!this.exists(source)) {

                return { success: false, error: `Source path does not exist: ${source}` }
            
            }

            const stat = statSync(source)
      
            if (stat.isDirectory()) {

                if (recursive) {

                    // Ensure destination directory exists
                    mkdirSync(destination, { recursive: true })
                    cpSync(source, destination, { recursive, errorOnExist, force })
                
                } else {

                    return { success: false, error: 'Cannot copy directory without recursive option' }
                
                }
            
            } else {

                // Copy file
                mkdirSync(join(destination, '..'), { recursive: true })
                cpSync(source, destination, { force })
            
            }

            return { success: true }
        
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Failed to copy ${source} to ${destination}: ${errorMessage}`)
            return { success: false, error: errorMessage }
        
        }
    
    }

    /**
   * Copy multiple files/directories with patterns
   */
    copyFiles(sourceDir: string, destDir: string, patterns: string[]): FileOperationsResult {

        try {

            for (const pattern of patterns) {

                const sourcePath = join(sourceDir, pattern)
                const destPath = join(destDir, pattern)
        
                if (this.exists(sourcePath)) {

                    const stat = statSync(sourcePath)
          
                    if (stat.isDirectory()) {

                        // Copy directory recursively
                        this.copy(sourcePath, destPath, { recursive: true, force: true })
                    
                    } else {

                        // Copy file
                        this.copy(sourcePath, destPath, { force: true })
                    
                    }
                
                }
            
            }
            return { success: true }
        
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Failed to copy files: ${errorMessage}`)
            return { success: false, error: errorMessage }
        
        }
    
    }

    /**
   * Get files from package.json "files" field
   */
    getFilesFromPackageJson(packageJson: Record<string, unknown>, packageDir: string): string[] {

        const files: string[] = []

        // Always include package.json
        files.push('package.json')
    
        // Include files specified in package.json "files" field
        if (packageJson.files && Array.isArray(packageJson.files)) {

            files.push(...packageJson.files)
        
        }
    
        // Include README.md if it exists
        if (this.exists(join(packageDir, 'README.md'))) {

            files.push('README.md')
        
        }
    
        // Include LICENSE files if they exist
        const licenseFiles = ['LICENSE', 'LICENSE.txt', 'LICENSE.md']

        for (const licenseFile of licenseFiles) {

            if (this.exists(join(packageDir, licenseFile))) {

                files.push(licenseFile)
            
            }
        
        }
    
        return files
    
    }

    /**
   * Check if file should be included based on include/exclude patterns
   */
    shouldIncludeFile(filePath: string, packageDir: string, includeFiles: string[], excludeFiles: string[]): boolean {

        const relativePath = relative(packageDir, filePath)
    
        // Check exclusions first
        for (const exclude of excludeFiles) {

            if (relativePath === exclude || relativePath.startsWith(exclude + '/')) {

                return false
            
            }
        
        }
    
        // Check inclusions
        for (const include of includeFiles) {

            if (relativePath === include || relativePath.startsWith(include + '/')) {

                return true
            
            }
        
        }
    
        return false
    
    }

    /**
     * Clean up directory recursively
     */
    async cleanupDirectory(path: string): Promise<FileOperationsResult> {

        try {

            if (this.exists(path)) {

                // Use temp package cleanup for temp directories, regular rm for others
                if (path.includes('.npack') || path.includes('temp-')) {

                    // This is a temporary directory, use temp package cleanup - no fallbacks
                    temp.cleanupSync()

                } else {

                    await rm(path, { recursive: true, force: true })

                }
            
            }
            return { success: true }
        
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Failed to cleanup directory ${path}: ${errorMessage}`)
            return { success: false, error: errorMessage }
        
        }
    
    }

    /**
     * Clean up old temporary directories for a package
     */
    async cleanupOldTempDirs(tempBase: string, tarballBaseName: string): Promise<FileOperationsResult> {

        try {

            if (!this.exists(tempBase)) {

                return { success: true }
            
            }

            // Use temp package cleanup - no fallbacks
            temp.cleanupSync()

            const entries = readdirSync(tempBase, { withFileTypes: true })
      
            for (const entry of entries) {

                if (entry.isDirectory() && entry.name.startsWith(`${tarballBaseName}-`)) {

                    try {

                        const { sync: rimrafSync } = await import('rimraf')

                        rimrafSync(join(tempBase, entry.name))
                    
                    } catch {
                        // Ignore cleanup errors for individual directories
                    }
                
                }
            
            }

            return { success: true }
        
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Failed to cleanup old temp directories: ${errorMessage}`)
            return { success: false, error: errorMessage }
        
        }
    
    }

}
