import type { ProcessedData } from '../types/TrialTypes.js'

/**
 * Data processing utility
 */
export class DataProcessor {
    /**
     * Processes raw data into structured format
     */
    static processData(rawData: string, metadata: Record<string, any> = {}): ProcessedData {
        if (!rawData || typeof rawData !== 'string') {
            throw new Error('Raw data must be a non-empty string')
        }

        const id = this.generateId()
        const timestamp = new Date()

        return {
            id,
            content: rawData.trim(),
            metadata: {
                ...metadata,
                processedAt: timestamp.toISOString(),
                length: rawData.length,
            },
            timestamp,
        }
    }

    /**
     * Processes multiple data items
     */
    static processBatch(rawDataItems: string[], metadata: Record<string, any> = {}): ProcessedData[] {
        if (!Array.isArray(rawDataItems)) {
            throw new Error('Raw data items must be an array')
        }

        return rawDataItems.map((item, index) => 
            this.processData(item, {
                ...metadata,
                batchIndex: index,
                batchSize: rawDataItems.length,
            })
        )
    }

    /**
     * Transforms processed data
     */
    static transformData(data: ProcessedData, transformer: (content: string) => string): ProcessedData {
        if (!data || typeof data !== 'object') {
            throw new Error('Data must be a valid ProcessedData object')
        }

        if (typeof transformer !== 'function') {
            throw new Error('Transformer must be a function')
        }

        try {
            const transformedContent = transformer(data.content)
            
            return {
                ...data,
                content: transformedContent,
                metadata: {
                    ...data.metadata,
                    transformed: true,
                    originalLength: data.content.length,
                    transformedLength: transformedContent.length,
                },
            }
        } catch (error) {
            throw new Error(`Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Filters processed data based on criteria
     */
    static filterData(dataItems: ProcessedData[], filterFn: (data: ProcessedData) => boolean): ProcessedData[] {
        if (!Array.isArray(dataItems)) {
            throw new Error('Data items must be an array')
        }

        if (typeof filterFn !== 'function') {
            throw new Error('Filter function must be a function')
        }

        return dataItems.filter(filterFn)
    }

    /**
     * Generates a unique ID
     */
    private static generateId(): string {
        return `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Validates processed data
     */
    static validateProcessedData(data: unknown): data is ProcessedData {
        if (!data || typeof data !== 'object') {
            return false
        }

        const obj = data as any
        
        return (
            typeof obj.id === 'string' &&
            typeof obj.content === 'string' &&
            typeof obj.metadata === 'object' &&
            obj.timestamp instanceof Date
        )
    }
}
