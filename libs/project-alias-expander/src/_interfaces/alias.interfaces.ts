// Alias management service interfaces
import type { AliasConfig } from '../_types/index.js'

export interface IAliasManagerService {
    generateLocalFiles(): void
    installAliases(): void
    refreshAliases(): void
    refreshAliasesDirect(): void
}
