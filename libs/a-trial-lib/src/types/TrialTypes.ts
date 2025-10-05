// Types for the trial library
export interface TrialConfig {
    name: string
    version: string
    enabled: boolean
    settings: Record<string, any>
}

export interface ProcessedData {
    id: string
    content: string
    metadata: Record<string, any>
    timestamp: Date
}

export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export interface TrialServiceOptions {
    configPath?: string
    debug?: boolean
    timeout?: number
}
