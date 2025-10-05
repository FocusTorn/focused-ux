import { load } from 'js-yaml'
import type { TrialConfig } from '../types/TrialTypes.js'

/**
 * Configuration loader utility
 */
export class ConfigLoader {
    /**
     * Loads configuration from a YAML string
     */
    static loadFromYaml(yamlContent: string): TrialConfig {
        try {
            const parsed = load(yamlContent) as any
            
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid YAML content')
            }

            return {
                name: parsed.name || 'default',
                version: parsed.version || '1.0.0',
                enabled: parsed.enabled ?? true,
                settings: parsed.settings || {},
            }
        } catch (error) {
            throw new Error(`Failed to load YAML config: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Loads configuration from a JSON string
     */
    static loadFromJson(jsonContent: string): TrialConfig {
        try {
            const parsed = JSON.parse(jsonContent)
            
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid JSON content')
            }

            return {
                name: parsed.name || 'default',
                version: parsed.version || '1.0.0',
                enabled: parsed.enabled ?? true,
                settings: parsed.settings || {},
            }
        } catch (error) {
            throw new Error(`Failed to load JSON config: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Creates a default configuration
     */
    static createDefault(): TrialConfig {
        return {
            name: 'trial-default',
            version: '1.0.0',
            enabled: true,
            settings: {
                timeout: 5000,
                retries: 3,
                debug: false,
            },
        }
    }

    /**
     * Merges two configurations
     */
    static merge(base: TrialConfig, override: Partial<TrialConfig>): TrialConfig {
        return {
            name: override.name ?? base.name,
            version: override.version ?? base.version,
            enabled: override.enabled ?? base.enabled,
            settings: {
                ...base.settings,
                ...override.settings,
            },
        }
    }
}
