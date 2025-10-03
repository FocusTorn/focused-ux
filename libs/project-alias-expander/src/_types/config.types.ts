export type TargetsMap = Record<string, string>

export type AliasValue = string | { name: string, suffix?: 'core' | 'ext', full?: boolean }

export type ContextAwareFlagValue = Record<string, import('./expandable.types.js').ExpandableValue>

export interface AliasConfig {
    'nxTargets'?: TargetsMap
    'feature-nxTargets'?: Record<string, import('./feature.types.js').FeatureTarget>
    'not-nxTargets'?: Record<string, string>
    'expandable-flags'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'context-aware-flags'?: Record<string, ContextAwareFlagValue>
    'expandable-templates'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'internal-flags'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'env-setting-flags'?: Record<string, import('./expandable.types.js').ExpandableValue>
    'expandable-commands'?: Record<string, string>
    'commands'?: Record<string, string>
    'nxPackages': Record<string, AliasValue>
}
