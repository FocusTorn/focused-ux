import type { AliasConfig } from '../_types/config.types.js'
import { CommandResolutionService } from './CommandResolutionService.js'
import { PackageResolutionService } from './PackageResolutionService.js'
import { TargetResolutionService } from './TargetResolutionService.js'

export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

export class ConfigurationValidator {
    private commandResolver: CommandResolutionService
    private packageResolver: PackageResolutionService
    private targetResolver: TargetResolutionService

    constructor() {
        this.commandResolver = new CommandResolutionService()
        this.packageResolver = new PackageResolutionService({ nxPackages: {} })
        this.targetResolver = new TargetResolutionService()
    }

    validate(config: AliasConfig): ValidationResult {
        const errors: string[] = []

        // Validate expandable commands
        errors.push(...this.commandResolver.validateExpandableCommands(config))

        // Validate package structure
        errors.push(...this.packageResolver.validatePackageStructure(config))

        // Validate target structure
        errors.push(...this.targetResolver.validateTargetStructure(config))

        // Validate template syntax
        errors.push(...this.validateTemplateSyntax(config))

        // Validate no conflicts between expandable commands and package aliases
        errors.push(...this.validateCommandConflicts(config))

        return { isValid: errors.length === 0, errors }
    }

    private validateTemplateSyntax(config: AliasConfig): string[] {
        const errors: string[] = []

        // Check expandable flags
        Object.entries(config['expandable-flags'] || {}).forEach(([key, value]) => {
            if (typeof value === 'object' && value.template) {
                if (value.template.includes('{') && !value.template.includes('{{')) {
                    errors.push(
                        `Template '${key}' uses old syntax '{variable}'. Use '{{variable}}' instead.`
                    )
                }
            }
        })

        // Check context-aware flags
        Object.entries(config['context-aware-flags'] || {}).forEach(
            ([contextKey, contextValue]) => {
                Object.entries(contextValue).forEach(([key, value]) => {
                    if (typeof value === 'object' && value.template) {
                        if (value.template.includes('{') && !value.template.includes('{{')) {
                            errors.push(
                                `Template '${contextKey}.${key}' uses old syntax '{variable}'. Use '{{variable}}' instead.`
                            )
                        }
                    }
                })
            }
        )

        // Check internal flags
        Object.entries(config['internal-flags'] || {}).forEach(([key, value]) => {
            if (typeof value === 'object' && value.template) {
                if (value.template.includes('{') && !value.template.includes('{{')) {
                    errors.push(
                        `Template '${key}' uses old syntax '{variable}'. Use '{{variable}}' instead.`
                    )
                }
            }
        })

        // Check env-setting flags
        Object.entries(config['env-setting-flags'] || {}).forEach(([key, value]) => {
            if (typeof value === 'object' && value.template) {
                if (value.template.includes('{') && !value.template.includes('{{')) {
                    errors.push(
                        `Template '${key}' uses old syntax '{variable}'. Use '{{variable}}' instead.`
                    )
                }
            }
        })

        return errors
    }

    private validateCommandConflicts(config: AliasConfig): string[] {
        const errors: string[] = []
        const expandableCommands = Object.keys(config['expandable-commands'] || {})
        const packageAliases = Object.keys(config.nxPackages || {})

        // Check for conflicts
        const conflicts = expandableCommands.filter((cmd) => packageAliases.includes(cmd))
        if (conflicts.length > 0) {
            errors.push(
                `Package aliases cannot be used as expandable commands: ${conflicts.join(', ')}`
            )
        }

        return errors
    }

    /**
     * Detects if the configuration is using the old format
     * Note: Legacy format detection is kept for reference but not used
     */
    isOldFormat(config: any): boolean {
        return (
            config.nxTargets !== undefined ||
            config['not-nxTargets'] !== undefined ||
            (config.nxPackages &&
                Object.values(config.nxPackages).some(
                    (value: any) => typeof value === 'object' && value.name && value.suffix
                ))
        )
    }
}
