// Alias management service interfaces
import type { AliasConfig } from '../_types/index.js'

export interface IAliasManagerService {
    generateLocalFiles(): void
    installAliases(): Promise<void>
    refreshAliases(): void
    refreshAliasesDirect(): Promise<void>
}
