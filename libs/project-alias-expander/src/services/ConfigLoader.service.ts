import { readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import stripJsonComments from 'strip-json-comments'
import type { AliasConfig } from '../_types/index.js'
import { ConfigUtils } from './CommonUtils.service.js'

/**
 * Configuration loader with lazy loading and validation
 * Supports both JSON and TypeScript config sources
 */
export class ConfigLoader {

    private static instance: ConfigLoader
    private config: AliasConfig | null = null
    private configPath: string | null = null
    private lastModified: number | null = null
    private validationErrors: string[] = []

    private constructor() {}

    static getInstance(): ConfigLoader {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader()
        }
        return ConfigLoader.instance
    }

    /**
     * Lazy load configuration with caching and validation
     */
    async loadConfig(): Promise<AliasConfig> {
        if (this.config && this.isConfigValid()) {
            return this.config
        }

        return this.loadConfigFromSource()
    }

    /**
     * Force reload configuration (clears cache)
     */
    async reloadConfig(): Promise<AliasConfig> {
        this.config = null
        this.lastModified = null
        this.validationErrors = []
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

        throw new Error('No configuration file found. Please ensure .pae.json exists in the project root.')
    }

    /**
     * Get list of potential config file paths in order of preference
     */
    private getConfigPaths(): string[] {
        const cwd = process.cwd()

        return [
            join(cwd, '.pae.json')  // Only root level JSON config
        ]
    }

    /**
     * Load configuration from a specific path
     */
    private async loadFromPath(path: string): Promise<AliasConfig> {
        if (path.endsWith('.json')) {
            return this.loadJsonConfig(path)
        }
        
        throw new Error(`Unsupported config file format: ${path}`)
    }

    /**
     * Load JSON configuration with validation
     */
    private loadJsonConfig(path: string): AliasConfig {
        try {
            const content = readFileSync(path, 'utf-8')
            const config = JSON.parse(stripJsonComments(content))
            
            // Validate configuration
            this.validateConfig(config, path)
            
            return config as AliasConfig
        } catch (error) {
            throw new Error(`Failed to parse JSON config from ${path}: ${error}`)
        }
    }

    /**
     * Validate configuration structure
     */
    private validateConfig(config: any, path: string): void {
        this.validationErrors = []

        // Basic structure validation
        if (!config || typeof config !== 'object') {
            this.validationErrors.push('Configuration must be an object')
            return
        }

        // Required fields
        if (!config.nxPackages) {
            this.validationErrors.push('Missing required field: nxPackages')
        }

        // Validate nxPackages structure
        if (config.nxPackages && typeof config.nxPackages === 'object') {
            for (const [alias, value] of Object.entries(config.nxPackages)) {
                if (typeof value === 'string') {
                    // String value is valid
                    continue
                } else if (typeof value === 'object' && value !== null) {
                    // Object value should have name property
                    if (!(value as any).name) {
                        this.validationErrors.push(`Package alias '${alias}' missing required 'name' property`)
                    }
                } else {
                    this.validationErrors.push(`Package alias '${alias}' has invalid value type`)
                }
            }
        }

        // Validate other sections are objects if present
        const objectSections = [
            'feature-nxTargets', 'nxTargets', 'not-nxTargets',
            'expandable-commands', 'commands', 'expandable-flags',
            'context-aware-flags', 'expandable-templates', 'internal-flags',
            'env-setting-flags'
        ]

        for (const section of objectSections) {
            if (config[section] && typeof config[section] !== 'object') {
                this.validationErrors.push(`Section '${section}' must be an object`)
            }
        }

        if (this.validationErrors.length > 0) {
            console.warn(`Configuration validation warnings for ${path}:`)
            this.validationErrors.forEach(error => console.warn(`  - ${error}`))
        }
    }

    /**
     * Get file modification time
     */
    private getFileModifiedTime(path: string): number {
        try {
            const stats = require('fs').statSync(path)

            return stats.mtime.getTime()
        } catch {
            return Date.now()
        }
    }

}

export function clearAllCaches(): void {
    ConfigLoader.getInstance().clearCache()
}

// Export the resolveProjectForAlias function for compatibility
export function resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, isFull: boolean } {
    return ConfigUtils.resolveProjectForAlias(aliasValue)
}
