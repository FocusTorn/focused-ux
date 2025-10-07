import { readFileSync, existsSync, watch, statSync } from 'fs'
import { join, resolve } from 'path'
import * as yaml from 'js-yaml'
import type { AliasConfig } from '../_types/index.js'
import { ConfigUtils } from './CommonUtils.service.js'
import { ConfigurationValidator } from './ConfigurationValidator.js'

/**
 * Configuration loader with dynamic loading, intelligent caching, and file watching
 * Supports YAML config sources with hot reloading
 */
export class ConfigLoader {
    private static instance: ConfigLoader
    private config: AliasConfig | null = null
    private configPath: string | null = null
    private lastModified: number | null = null
    private validationErrors: string[] = []
    private watcher: any = null
    private validator: ConfigurationValidator
    private configDependencies: Map<string, number> = new Map() // Track dependency files
    private cacheKey: string | null = null
    private reloadCallbacks: Set<() => void> = new Set()

    private constructor() {
        this.validator = new ConfigurationValidator()
    }

    static getInstance(): ConfigLoader {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader()
        }
        return ConfigLoader.instance
    }

    /**
     * Lazy load configuration with intelligent caching and validation
     */
    async loadConfig(): Promise<AliasConfig> {
        // Check if cache is still valid
        if (this.config && this.isCacheValid()) {
            return this.config
        }

        return this.loadConfigFromSource()
    }

    /**
     * Force reload configuration (clears cache)
     */
    async reloadConfig(): Promise<AliasConfig> {
        this.clearCache()
        return this.loadConfigFromSource()
    }

    /**
     * Get cached configuration without loading
     */
    getCachedConfig(): AliasConfig | null {
        return this.config
    }

    /**
     * Clear all caches
     */
    clearCache(): void {
        this.config = null
        this.lastModified = null
        this.validationErrors = []
        this.cacheKey = null
        this.configDependencies.clear()
    }

    /**
     * Get validation errors from last load
     */
    getValidationErrors(): string[] {
        return [...this.validationErrors]
    }

    /**
     * Check if current config is still valid (not modified)
     */
    private isConfigValid(): boolean {
        if (!this.configPath || !this.lastModified) {
            return false
        }

        try {
            const stats = require('fs').statSync(this.configPath)

            return stats.mtime.getTime() === this.lastModified
        } catch {
            return false
        }
    }

    /**
     * Load configuration from available sources
     */
    private async loadConfigFromSource(): Promise<AliasConfig> {
        const configPaths = this.getConfigPaths()

        for (const path of configPaths) {
            if (existsSync(path)) {
                try {
                    const config = await this.loadFromPath(path)

                    if (config) {
                        this.config = config
                        this.configPath = path
                        this.lastModified = this.getFileModifiedTime(path)
                        return config
                    }
                } catch (error) {
                    throw new Error(`Failed to load config from ${path}: ${error}`)
                }
            }
        }

        throw new Error(
            'No configuration file found. Please ensure .pae.yaml exists in the project root.'
        )
    }

    /**
     * Get list of potential config file paths in order of preference
     */
    private getConfigPaths(): string[] {
        const cwd = process.cwd()

        return [
            join(cwd, '.pae.yaml'), // YAML config
            join(cwd, '.pae.yml'), // Alternative YAML extension
        ]
    }

    /**
     * Load configuration from a specific path
     */
    private async loadFromPath(path: string): Promise<AliasConfig> {
        if (path.endsWith('.yaml') || path.endsWith('.yml')) {
            return this.loadYamlConfig(path)
        }

        throw new Error(`Unsupported config file format: ${path}. Only YAML files are supported.`)
    }

    /**
     * Load YAML configuration with validation
     */
    private loadYamlConfig(path: string): AliasConfig {
        try {
            const content = readFileSync(path, 'utf-8')
            const config = yaml.load(content) as any

            // Validate configuration using the validator
            this.validateConfigWithValidator(config, path)

            return config as AliasConfig
        } catch (error) {
            throw new Error(`Failed to parse YAML config from ${path}: ${error}`)
        }
    }

    /**
     * Validate configuration using the ConfigurationValidator
     */
    private validateConfigWithValidator(config: any, path: string): void {
        this.validationErrors = []

        // Use the validator for all configurations
        const validationResult = this.validator.validate(config)
        if (!validationResult.isValid) {
            this.validationErrors = validationResult.errors
            throw new Error(
                `Configuration validation failed: ${validationResult.errors.join(', ')}`
            )
        }
    }

    /**
     * Get file modification time
     */
    private getFileModifiedTime(path: string): number {
        try {
            const stats = statSync(path)
            return stats.mtime.getTime()
        } catch {
            return Date.now()
        }
    }

    /**
     * Start watching config file for changes (hot reload)
     */
    startWatching(): void {
        if (this.watcher || !this.configPath) {
            return
        }

        try {
            this.watcher = watch(this.configPath, (eventType) => {
                if (eventType === 'change') {
                    console.log('🔄 Configuration file changed, reloading...')
                    this.handleConfigChange()
                }
            })
            console.log(`👀 Watching configuration file: ${this.configPath}`)
        } catch (error) {
            console.warn(`Failed to start file watcher: ${error}`)
        }
    }

    /**
     * Stop watching config file
     */
    stopWatching(): void {
        if (this.watcher) {
            this.watcher.close()
            this.watcher = null
            console.log('👀 Stopped watching configuration file')
        }
    }

    /**
     * Handle configuration file change
     */
    private async handleConfigChange(): Promise<void> {
        try {
            // Clear cache and reload
            this.clearCache()
            await this.loadConfigFromSource()

            // Notify callbacks
            this.reloadCallbacks.forEach((callback) => {
                try {
                    callback()
                } catch (error) {
                    console.warn('Error in reload callback:', error)
                }
            })

            console.log('✅ Configuration reloaded successfully')
        } catch (error) {
            console.error('❌ Failed to reload configuration:', error)
        }
    }

    /**
     * Add callback for config reload events
     */
    onConfigReload(callback: () => void): () => void {
        this.reloadCallbacks.add(callback)

        // Return unsubscribe function
        return () => {
            this.reloadCallbacks.delete(callback)
        }
    }

    /**
     * Generate cache key based on file dependencies
     */
    private generateCacheKey(): string {
        if (!this.configPath) {
            return 'no-config'
        }

        const dependencies = Array.from(this.configDependencies.entries())
            .map(([path, mtime]) => `${path}:${mtime}`)
            .join('|')

        return `${this.configPath}:${this.lastModified}:${dependencies}`
    }

    /**
     * Check if cache is still valid based on dependencies
     */
    private isCacheValid(): boolean {
        if (!this.config || !this.configPath || !this.lastModified) {
            return false
        }

        // Check main config file
        try {
            const stats = statSync(this.configPath)
            if (stats.mtime.getTime() !== this.lastModified) {
                return false
            }
        } catch {
            return false
        }

        // Check dependency files
        for (const [path, lastMtime] of this.configDependencies.entries()) {
            try {
                const stats = statSync(path)
                if (stats.mtime.getTime() !== lastMtime) {
                    return false
                }
            } catch {
                return false
            }
        }

        return true
    }

    /**
     * Track dependency file for cache invalidation
     */
    addDependency(path: string): void {
        try {
            const stats = statSync(path)
            this.configDependencies.set(path, stats.mtime.getTime())
        } catch (error) {
            console.warn(`Failed to track dependency ${path}:`, error)
        }
    }

    /**
     * Clear dependency tracking
     */
    clearDependencies(): void {
        this.configDependencies.clear()
    }
}

export function clearAllCaches(): void {
    ConfigLoader.getInstance().clearCache()
}

// Export the resolveProjectForAlias function for compatibility
export function resolveProjectForAlias(
    aliasValue: string | { name: string; suffix?: 'core' | 'ext'; full?: boolean }
): { project: string; isFull: boolean } {
    return ConfigUtils.resolveProjectForAlias(aliasValue)
}
