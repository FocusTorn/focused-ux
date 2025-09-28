// Configuration interfaces
import type { AliasConfig, AliasValue } from '../_types/index.js'

export interface IConfigLoader {
    loadAliasConfig(): AliasConfig
}

export interface IProjectResolver {
    resolveProjectForAlias(aliasValue: AliasValue): { project: string, isFull: boolean }
}
