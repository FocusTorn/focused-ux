import type { AliasConfig } from '../_types/config.types.js'

export class TargetResolutionService {
    /**
     * Resolve target using the new nested structure
     */
    resolveTarget(target: string, config: AliasConfig): string {
        // Check feature targets first (highest priority)
        if (config['feature-nxTargets']?.[target]) {
            return config['feature-nxTargets'][target]['run-target']
        }

        // Check new nested targets structure
        if (config.targets?.['nx-targets']?.[target]) {
            return config.targets['nx-targets'][target]
        }

        if (config.targets?.['not-nx-target']?.[target]) {
            return config.targets['not-nx-target'][target]
        }

        // Return target as-is if not found (might be a custom target)
        return target
    }

    /**
     * Get all available targets from the configuration
     */
    getAllTargets(config: AliasConfig): { nx: string[], external: string[], feature: string[] } {
        const nx: string[] = []
        const external: string[] = []
        const feature: string[] = []

        // Feature targets
        if (config['feature-nxTargets']) {
            feature.push(...Object.keys(config['feature-nxTargets']))
        }

        // New nested structure
        if (config.targets?.['nx-targets']) {
            nx.push(...Object.keys(config.targets['nx-targets']))
        }

        if (config.targets?.['not-nx-target']) {
            external.push(...Object.keys(config.targets['not-nx-target']))
        }

        return { nx, external, feature }
    }

    /**
     * Check if a target exists in the configuration
     */
    hasTarget(target: string, config: AliasConfig): boolean {
        return (
            config['feature-nxTargets']?.[target] !== undefined ||
            config.targets?.['nx-targets']?.[target] !== undefined ||
            config.targets?.['not-nx-target']?.[target] !== undefined
        )
    }

    /**
     * Get target type (feature, nx, external)
     */
    getTargetType(target: string, config: AliasConfig): 'feature' | 'nx' | 'external' | 'unknown' {
        if (config['feature-nxTargets']?.[target]) {
            return 'feature'
        }

        if (config.targets?.['nx-targets']?.[target]) {
            return 'nx'
        }

        if (config.targets?.['not-nx-target']?.[target]) {
            return 'external'
        }

        return 'unknown'
    }

    /**
     * Validate target structure
     */
    validateTargetStructure(config: AliasConfig): string[] {
        const errors: string[] = []

        // Validate new target structure
        if (config.targets) {
            if (!config.targets['nx-targets'] && !config.targets['not-nx-target']) {
                errors.push('Targets structure must contain at least one of "nx-targets" or "not-nx-target"')
            }

            // Check for duplicate targets between sections
            const nxTargets = Object.keys(config.targets['nx-targets'] || {})
            const externalTargets = Object.keys(config.targets['not-nx-target'] || {})
            const duplicates = nxTargets.filter(target => externalTargets.includes(target))
            
            if (duplicates.length > 0) {
                errors.push(`Duplicate targets found between nx-targets and not-nx-target: ${duplicates.join(', ')}`)
            }
        }

        return errors
    }
}
