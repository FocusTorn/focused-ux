export type TargetsMap = Record<string, string>

// New package definition type for simplified structure
export interface PackageDefinition {
    aliases: string[]
    variants: Record<string, string>
    default?: string
}

export type ContextAwareFlagValue = Record<string, import('./expandable.types.js').ExpandableValue>

export interface AliasConfig {
    'feature-nxTargets'?: Record<string, import('./feature.types.js').FeatureTarget>
    targets?: {
        'nx-targets'?: TargetsMap
        'not-nx-target'?: TargetsMap
    }
    'expandable-commands'?: Record<string, string>
    'expandable-flags'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'context-aware-flags'?: Record<string, ContextAwareFlagValue>
    'internal-flags'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'env-setting-flags'?: Record<string, import('./expandable.types.js').ExpandableValue>
    nxPackages: Record<string, string | PackageDefinition>
}
