import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'node:url'
import stripJsonComments from 'strip-json-comments'
import type { AliasConfig } from './_types/index.js'
import { ConfigUtils } from './services/CommonUtils.service.js'

const __filename = fileURLToPath(import.meta.url)
const PACKAGE_ROOT = path.resolve(path.dirname(__filename), '..')

// Debug mode - check environment variable or debug flag
const DEBUG = process.env.PAE_DEBUG === '1' || process.argv.includes('-d') || process.argv.includes('--debug')

function debug(message: string, ...args: any[]) {
    if (DEBUG) {
        console.error(`[CONFIG CACHE DEBUG] ${message}`, ...args)
    }
}

interface CachedConfig {
    config: AliasConfig
    mtime: number
    hash: string
}

class ConfigurationCache {

    private cache = new Map<string, CachedConfig>()
    private watchers = new Map<string, fs.FSWatcher>()

    getConfig(path: string): AliasConfig | null {
        const cached = this.cache.get(path)

        if (cached && !this.isStale(cached, path)) {
            debug(`Cache hit for config: ${path}`)
            return cached.config
        }
        debug(`Cache miss for config: ${path}`)
        return null
    }

    setConfig(path: string, config: AliasConfig): void {
        const stats = fs.statSync(path)
        const hash = this.hashConfig(config)
        
        this.cache.set(path, {
            config,
            mtime: stats.mtimeMs,
            hash
        })

        debug(`Cached config: ${path}, mtime: ${stats.mtimeMs}, hash: ${hash}`)

        // Set up file watcher for invalidation
        this.setupWatcher(path)
    }

    private isStale(cached: CachedConfig, path: string): boolean {
        try {
            const stats = fs.statSync(path)
            const isStale = stats.mtimeMs > cached.mtime

            if (isStale) {
                debug(`Config is stale: ${path}, cached: ${cached.mtime}, current: ${stats.mtimeMs}`)
            }
            return isStale
        } catch {
            // File doesn't exist anymore
            debug(`Config file no longer exists: ${path}`)
            return true
        }
    }

    private hashConfig(config: AliasConfig): string {
        // Simple hash based on JSON stringification
        return JSON.stringify(config).length.toString()
    }

    private setupWatcher(path: string): void {
        if (this.watchers.has(path)) return

        try {
            const watcher = fs.watch(path, () => {
                debug(`Config file changed, invalidating cache: ${path}`)
                this.cache.delete(path)
                this.watchers.delete(path)
            })

            this.watchers.set(path, watcher)
            debug(`Set up file watcher for: ${path}`)
        } catch (error) {
            debug(`Failed to set up watcher for ${path}:`, error)
        }
    }

    clearCache(): void {
        debug('Clearing entire configuration cache')
        this.cache.clear()
        
        // Close all watchers
        for (const [path, watcher] of this.watchers) {
            watcher.close()
            debug(`Closed watcher for: ${path}`)
        }
        this.watchers.clear()
    }

    getCacheStats(): { size: number, paths: string[] } {
        return {
            size: this.cache.size,
            paths: Array.from(this.cache.keys())
        }
    }

}

// Singleton instance
const configCache = new ConfigurationCache()

export function loadAliasConfigCached(): AliasConfig {
    // Try multiple possible locations for config.json
    const possiblePaths = [
        // If running from project root
        path.join(process.cwd(), 'libs', 'project-alias-expander', 'config.json'),
        // If running from package directory
        path.join(process.cwd(), 'config.json'),
        // If running from compiled dist
        path.join(PACKAGE_ROOT, 'config.json'),
        // Fallback to relative path
        path.resolve('libs/project-alias-expander/config.json')
    ]
    
    for (const configPath of possiblePaths) {
        debug(`Trying config path: ${configPath}`)
        debug(`  existsSync result: ${fs.existsSync(configPath)}`)
        
        try {
            if (fs.existsSync(configPath)) {
                // Check cache first
                const cachedConfig = configCache.getConfig(configPath)

                if (cachedConfig) {
                    debug(`  Using cached config from: ${configPath}`)
                    return cachedConfig
                }

                debug(`  Found config file, reading content...`)

                const configContent = fs.readFileSync(configPath, 'utf-8')

                debug(`  Config content length: ${configContent.length}`)

                const strippedContent = stripJsonComments(configContent)

                debug(`  Stripped content length: ${strippedContent.length}`)

                const parsed = JSON.parse(strippedContent)

                debug(`  Config parsed successfully`)

                // Cache the result
                configCache.setConfig(configPath, parsed)
                
                return parsed
            }
        } catch (error) {
            debug(`  Error with path ${configPath}:`, error)
            // Continue to next path
        }
    }
    
    // If none of the paths worked, throw error with the first attempted path
    const firstPath = possiblePaths[0]

    console.error(`Failed to load config from any of these locations:`, possiblePaths)
    throw new Error(`Config file not found. Tried: ${possiblePaths.join(', ')}`)
}

// Legacy function for backward compatibility
export function loadAliasConfig(): AliasConfig {
    return loadAliasConfigCached()
}

export function resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, isFull: boolean } {
    return ConfigUtils.resolveProjectForAlias(aliasValue)
}

// Export cache utilities for testing and monitoring
export { configCache, ConfigurationCache }
export type { CachedConfig }