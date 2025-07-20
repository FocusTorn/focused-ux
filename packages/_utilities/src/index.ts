// Individual exports for manual tree-shaking
// Interfaces
export type { IConfigurationService } from './_interfaces/IConfigurationService.js'
export type { IFileSystem, FileStats, DirectoryEntry } from './_interfaces/IFileSystem.js'
export type { IProcess } from './_interfaces/IProcess.js'

// Services
export { ConfigurationService } from './services/Configuration.service.js'

// VSCode Utilities
export { showTimedInformationMessage } from './vscode/window.js'

// Legacy barrel exports (for backward compatibility)
// export * from './_interfaces/IConfigurationService.js'
// export * from './_interfaces/IFileSystem.js'
// export * from './_interfaces/IProcess.js'
// export { ConfigurationService } from './services/Configuration.service.js'
// export { showTimedInformationMessage } from './vscode/window.js'
