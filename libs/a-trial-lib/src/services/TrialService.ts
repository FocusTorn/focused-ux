import { ConfigLoader } from '../utils/ConfigLoader.js'
import { DataProcessor } from '../utils/DataProcessor.js'
import { ValidationUtils } from '../utils/ValidationUtils.js'
import type { TrialConfig, ProcessedData, TrialServiceOptions } from '../types/TrialTypes.js'

/**
 * Main service for the trial library
 */
export class TrialService {
    private config: TrialConfig
    private options: TrialServiceOptions

    constructor(options: TrialServiceOptions = {}) {
        this.options = {
            configPath: options.configPath,
            debug: options.debug ?? false,
            timeout: options.timeout ?? 5000,
        }
        this.config = ConfigLoader.createDefault()
    }

    /**
     * Initializes the service with configuration
     */
    async initialize(configContent?: string, configType: 'yaml' | 'json' = 'json'): Promise<void> {
        try {
            if (configContent) {
                const loadedConfig = configType === 'yaml' 
                    ? ConfigLoader.loadFromYaml(configContent)
                    : ConfigLoader.loadFromJson(configContent)
                
                const validation = ValidationUtils.validateConfig(loadedConfig)
                if (!validation.isValid) {
                    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
                }

                this.config = ConfigLoader.merge(this.config, loadedConfig)
            }

            if (this.options.debug) {
                console.log('TrialService initialized with config:', this.config)
            }
        } catch (error) {
            throw new Error(`Failed to initialize TrialService: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Processes data using the configured settings
     */
    async processData(rawData: string, metadata: Record<string, any> = {}): Promise<ProcessedData> {
        if (!this.config.enabled) {
            throw new Error('Service is disabled')
        }

        try {
            const processedData = DataProcessor.processData(rawData, {
                ...metadata,
                serviceConfig: this.config.name,
                serviceVersion: this.config.version,
            })

            if (this.options.debug) {
                console.log('Processed data:', processedData)
            }

            return processedData
        } catch (error) {
            throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Processes multiple data items in batch
     */
    async processBatch(rawDataItems: string[], metadata: Record<string, any> = {}): Promise<ProcessedData[]> {
        if (!this.config.enabled) {
            throw new Error('Service is disabled')
        }

        try {
            const processedItems = DataProcessor.processBatch(rawDataItems, {
                ...metadata,
                serviceConfig: this.config.name,
                serviceVersion: this.config.version,
            })

            if (this.options.debug) {
                console.log(`Processed ${processedItems.length} items`)
            }

            return processedItems
        } catch (error) {
            throw new Error(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Transforms processed data using a custom transformer
     */
    async transformData(data: ProcessedData, transformer: (content: string) => string): Promise<ProcessedData> {
        if (!this.config.enabled) {
            throw new Error('Service is disabled')
        }

        try {
            const transformedData = DataProcessor.transformData(data, transformer)

            if (this.options.debug) {
                console.log('Transformed data:', transformedData)
            }

            return transformedData
        } catch (error) {
            throw new Error(`Data transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Gets the current configuration
     */
    getConfig(): TrialConfig {
        return { ...this.config }
    }

    /**
     * Updates the configuration
     */
    updateConfig(updates: Partial<TrialConfig>): void {
        const validation = ValidationUtils.validateConfig({ ...this.config, ...updates })
        if (!validation.isValid) {
            throw new Error(`Configuration update validation failed: ${validation.errors.join(', ')}`)
        }

        this.config = ConfigLoader.merge(this.config, updates)

        if (this.options.debug) {
            console.log('Configuration updated:', this.config)
        }
    }

    /**
     * Checks if the service is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled
    }

    /**
     * Enables or disables the service
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled

        if (this.options.debug) {
            console.log(`Service ${enabled ? 'enabled' : 'disabled'}`)
        }
    }

    /**
     * Gets service status information
     */
    getStatus(): { enabled: boolean; configName: string; version: string; options: TrialServiceOptions } {
        return {
            enabled: this.config.enabled,
            configName: this.config.name,
            version: this.config.version,
            options: { ...this.options },
        }
    }
}
