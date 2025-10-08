// Core Services
export { StagingService } from './Staging.service.js'
export { PackagingService } from './Packaging.service.js'
export { InstallationService } from './Installation.service.js'

// Support Services
export { OutputManager } from './OutputManager.service.js'
export { PackageResolverService } from './PackageResolver.service.js'

// Interfaces - Staging
export type { StagingOptions, StagingResult } from './Staging.service.js'

// Interfaces - Packaging
export type { PackagingOptions, PackagingResult, ValidationResult as PackagingValidationResult } from './Packaging.service.js'

// Interfaces - Installation
export type { InstallationOptions, InstallationResult, ValidationResult as InstallationValidationResult } from './Installation.service.js'

// Interfaces - Package Resolver
export type { PackageMetadata, ResolvedConfiguration } from './PackageResolver.service.js'
