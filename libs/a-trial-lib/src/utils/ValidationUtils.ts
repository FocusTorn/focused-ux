import type { TrialConfig, ValidationResult } from '../types/TrialTypes.js'

/**
 * Utility functions for data validation
 */
export class ValidationUtils {
    /**
     * Validates a trial configuration object
     */
    static validateConfig(config: unknown): ValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        if (!config || typeof config !== 'object') {
            errors.push('Config must be an object')
            return { isValid: false, errors, warnings }
        }

        const configObj = config as Record<string, any>

        // Required fields validation
        if (!configObj.name || typeof configObj.name !== 'string') {
            errors.push('Config must have a valid name field')
        }

        if (!configObj.version || typeof configObj.version !== 'string') {
            errors.push('Config must have a valid version field')
        }

        if (typeof configObj.enabled !== 'boolean') {
            errors.push('Config must have a valid enabled field')
        }

        // Optional warnings
        if (!configObj.settings || typeof configObj.settings !== 'object') {
            warnings.push('Config should have a settings object')
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Validates a string input
     */
    static validateString(input: unknown, fieldName: string): ValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        if (typeof input !== 'string') {
            errors.push(`${fieldName} must be a string`)
        } else if (input.trim().length === 0) {
            warnings.push(`${fieldName} should not be empty`)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Validates a number input
     */
    static validateNumber(input: unknown, fieldName: string, min?: number, max?: number): ValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        if (typeof input !== 'number' || isNaN(input)) {
            errors.push(`${fieldName} must be a valid number`)
        } else {
            if (min !== undefined && input < min) {
                errors.push(`${fieldName} must be at least ${min}`)
            }
            if (max !== undefined && input > max) {
                errors.push(`${fieldName} must be at most ${max}`)
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }
}
