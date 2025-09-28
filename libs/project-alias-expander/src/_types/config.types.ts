export type TargetsMap = Record<string, string>

export type AliasValue = string | { name: string, suffix?: 'core' | 'ext', full?: boolean }

export interface AliasConfig {
    'nxTargets'?: TargetsMap
    'feature-nxTargets'?: Record<string, import('./feature.types.js').FeatureTarget>
    'not-nxTargets'?: Record<string, string>
    'expandable-flags'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'expandable-templates'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'nxPackages': Record<string, AliasValue>
}
